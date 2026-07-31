import { useEffect, useRef, useState } from 'react';
import * as ROSLIB from 'roslib';
import { useAuth } from '../../context/AuthContext';

/**
 * RobotLiveView — a live, RViz-style 2D view of the robot in its SLAM map.
 *
 * This replaces the old "Faculty Radar Map", which was decorative only: the
 * obstacle dots were hardcoded CSS positions and the sweep was a CSS gradient.
 * Nothing in it came from the robot.
 *
 * WHY THIS RATHER THAN A VIDEO STREAM OF RVIZ
 * -------------------------------------------
 * Screencasting the real RViz would mean running RViz headless on the Pi under
 * Xvfb and H.264/MJPEG-encoding it — several times the CPU of the entire
 * navigation stack, on a Pi 4B that already browns out under load. It would
 * also be a one-way video: no zoom, no toggling layers, and unreadable on a
 * phone.
 *
 * Instead we subscribe to the same ROS topics RViz itself draws and render them
 * on a canvas. It is the same information, live, at a fraction of the
 * bandwidth, and it stays crisp at any size.
 *
 * TOPICS (all via rosbridge)
 *   /map        nav_msgs/OccupancyGrid  latched, arrives once — the SLAM map
 *   /scan       sensor_msgs/LaserScan   throttled to 5 Hz — live obstacles
 *   /amcl_pose  .../PoseWithCovarianceStamped  — localised robot pose
 *   /plan       nav_msgs/Path           throttled — current global plan
 *
 * The laser is mounted on the robot's centre axis (offset is in Z only), so
 * scan points are placed using the robot pose alone. That is accurate enough
 * for a preview and avoids pulling a full TF tree into the browser.
 */

const SCAN_THROTTLE_MS = 200;   // 5 Hz — plenty for a preview, 1/6th the data
const PLAN_THROTTLE_MS = 500;

function quatToYaw(q) {
  return Math.atan2(2 * (q.w * q.z + q.x * q.y),
                    1 - 2 * (q.y * q.y + q.z * q.z));
}

export default function RobotLiveView() {
  const { rosConn, isRobotOnline, rosBridgeUrl } = useAuth();
  const canvasRef = useRef(null);

  // Kept in refs, not state: these update at up to 5 Hz and re-rendering React
  // on every scan would be wasteful. The canvas is redrawn directly instead.
  const mapRef = useRef(null);
  const mapBitmapRef = useRef(null);
  const scanRef = useRef(null);
  const poseRef = useRef(null);
  const planRef = useRef(null);

  const [haveMap, setHaveMap] = useState(false);
  const [poseText, setPoseText] = useState(null);

  // ── subscriptions ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rosConn) return;

    const mapTopic = new ROSLIB.Topic({
      ros: rosConn, name: '/map', messageType: 'nav_msgs/OccupancyGrid',
    });
    const scanTopic = new ROSLIB.Topic({
      ros: rosConn, name: '/scan', messageType: 'sensor_msgs/LaserScan',
      throttle_rate: SCAN_THROTTLE_MS, queue_length: 1,
    });
    const poseTopic = new ROSLIB.Topic({
      ros: rosConn, name: '/amcl_pose',
      messageType: 'geometry_msgs/PoseWithCovarianceStamped',
    });
    const planTopic = new ROSLIB.Topic({
      ros: rosConn, name: '/plan', messageType: 'nav_msgs/Path',
      throttle_rate: PLAN_THROTTLE_MS, queue_length: 1,
    });

    mapTopic.subscribe((msg) => {
      mapRef.current = msg;
      // Rasterise once into an ImageData; redrawing 15k cells every frame
      // would be pointless when the map never changes.
      const { width, height } = msg.info;
      const img = new ImageData(width, height);
      for (let i = 0; i < width * height; i++) {
        const v = msg.data[i];
        // ROS occupancy: -1 unknown, 0 free, 100 occupied.
        let r, g, b, a = 255;
        if (v < 0) { r = g = b = 0; a = 0; }          // unknown -> transparent
        else if (v >= 65) { r = g = b = 30; }          // wall -> near-black
        else { r = g = b = 245; }                      // free -> near-white
        // OccupancyGrid row 0 is the BOTTOM row (+y up); canvas row 0 is the
        // top. Flip here so the map is not drawn upside-down.
        const x = i % width;
        const y = height - 1 - Math.floor(i / width);
        const o = (y * width + x) * 4;
        img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b;
        img.data[o + 3] = a;
      }
      createImageBitmap(img).then((bm) => {
        mapBitmapRef.current = bm;
        setHaveMap(true);
      });
    });

    scanTopic.subscribe((msg) => { scanRef.current = msg; });
    planTopic.subscribe((msg) => { planRef.current = msg; });
    poseTopic.subscribe((msg) => {
      poseRef.current = msg.pose.pose;
      const p = msg.pose.pose.position;
      const yaw = quatToYaw(msg.pose.pose.orientation);
      setPoseText(`x ${p.x.toFixed(2)} m · y ${p.y.toFixed(2)} m · ${(yaw * 180 / Math.PI).toFixed(0)}°`);
    });

    return () => {
      mapTopic.unsubscribe();
      scanTopic.unsubscribe();
      poseTopic.unsubscribe();
      planTopic.unsubscribe();
    };
  }, [rosConn]);

  // ── render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    let raf;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cv = canvasRef.current;
      const map = mapRef.current;
      if (!cv || !map) return;

      const ctx = cv.getContext('2d');
      const { resolution: res, origin } = map.info;
      const mw = map.info.width, mh = map.info.height;

      // Fit the map into the canvas, preserving aspect.
      const scale = Math.min(cv.width / mw, cv.height / mh);
      const drawW = mw * scale, drawH = mh * scale;
      const offX = (cv.width - drawW) / 2, offY = (cv.height - drawH) / 2;

      // world (metres, map frame) -> canvas pixels
      const toPx = (wx, wy) => [
        offX + ((wx - origin.position.x) / res) * scale,
        offY + drawH - ((wy - origin.position.y) / res) * scale,
      ];

      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, cv.width, cv.height);

      if (mapBitmapRef.current) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(mapBitmapRef.current, offX, offY, drawW, drawH);
      }

      const pose = poseRef.current;

      // global plan
      const plan = planRef.current;
      if (plan?.poses?.length) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        plan.poses.forEach((ps, i) => {
          const [px, py] = toPx(ps.pose.position.x, ps.pose.position.y);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        });
        ctx.stroke();
      }

      // laser scan, placed from the robot pose
      const scan = scanRef.current;
      if (scan && pose) {
        const yaw = quatToYaw(pose.orientation);
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < scan.ranges.length; i++) {
          const r = scan.ranges[i];
          if (!(r > scan.range_min && r < scan.range_max)) continue;
          const a = yaw + scan.angle_min + i * scan.angle_increment;
          const [px, py] = toPx(pose.position.x + r * Math.cos(a),
                                pose.position.y + r * Math.sin(a));
          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
      }

      // robot: footprint circle + heading wedge
      if (pose) {
        const [px, py] = toPx(pose.position.x, pose.position.y);
        const yaw = quatToYaw(pose.orientation);
        const rPx = Math.max(5, (0.22 / res) * scale);   // ~robot radius

        ctx.beginPath();
        ctx.arc(px, py, rPx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.30)';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px, py);
        // canvas y is inverted relative to the map frame, hence -sin
        ctx.lineTo(px + Math.cos(yaw) * rPx * 1.9,
                   py - Math.sin(yaw) * rPx * 1.9);
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [haveMap]);

  const status = !rosConn
    ? { text: 'Standby / Offline', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
    : !haveMap
      ? { text: 'Loading /map', tone: 'text-sky-700 bg-sky-50 border-sky-200' }
      : { text: 'Live Telemetry', tone: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-md">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Live Robot SLAM & Telemetry</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            SLAM map, live LiDAR scan, localized pose and planned route — streamed from ROS
          </p>
        </div>
        <span className={`text-[10px] border px-3 py-1 rounded-full font-bold uppercase tracking-wider ${status.tone}`}>
          {status.text}
        </span>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden mt-6 min-h-[320px] sm:min-h-[420px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={900}
          height={620}
          className="w-full h-auto block"
        />

        {!rosConn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center px-6 backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-4 shadow-lg">
              📡
            </div>
            <h4 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">ROS Hardware Telemetry Standby</h4>
            <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed font-medium">
              Waiting for live ROS bridge connection at <code className="font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">{rosBridgeUrl}</code>.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] uppercase tracking-wider font-bold">
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg">
                Topic: /map · /scan · /amcl_pose
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg">
                WebSocket Port: 9090
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[11px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Robot</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> LiDAR returns</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 inline-block" /> Planned route</span>
        <span className="ml-auto font-mono text-slate-400">
          {poseText ? `pose ${poseText}` : (isRobotOnline ? 'awaiting localisation' : 'hardware standby')}
        </span>
      </div>
    </div>
  );
}
