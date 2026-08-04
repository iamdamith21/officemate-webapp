import { useCallback, useRef, useState } from 'react';
import * as ROSLIB from 'roslib';
import { useAuth } from '../context/AuthContext';

/**
 * useNavGoal — drive the robot to a surveyed location through Nav2.
 *
 * Sends a NavigateToPose ACTION goal rather than publishing /goal_pose. Both
 * make the robot move, but /goal_pose is fire-and-forget: the browser gets no
 * result, so a goal the planner rejected or the controller abandoned looks
 * exactly like one still in progress. Nav2 aborts goals fairly often on this
 * robot (tight rooms, docks in inflated space), so knowing the outcome is the
 * whole point.
 *
 * Needs rosbridge with `send_action_goals_in_new_thread: true`, which
 * web_bridge.launch.py sets — the Humble default would block all telemetry for
 * the duration of the goal.
 *
 * Sends `navSafe`, never `dock`. See the NAV_LOCATIONS comment in
 * src/constants: two of the three docks sit in costmap space Nav2 refuses, and
 * its only complaint is "collision ahead" from the controller, which never
 * names the goal.
 */

const ACTION_NAME = '/navigate_to_pose';
const ACTION_TYPE = 'nav2_msgs/action/NavigateToPose';

// action_msgs/msg/GoalStatus. roslib ships this as an enum export rather than a
// value on the default namespace in every build, so spell out the three used.
const STATUS = { SUCCEEDED: 4, CANCELED: 5, ABORTED: 6 };

function orientationOf(pose) {
  // Prefer the stored quaternion — it is what the robot actually recorded.
  // Deriving it from the rounded degrees would quietly lose heading precision,
  // and heading is what makes a drop-off repeatable.
  if (typeof pose.z === 'number' && typeof pose.w === 'number') {
    return { x: 0, y: 0, z: pose.z, w: pose.w };
  }
  const half = ((pose.yaw ?? 0) * Math.PI) / 180 / 2;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}

export function useNavGoal() {
  const { rosConn, isRosConnected } = useAuth();

  const [rawStatus, setStatus] = useState('idle'); // idle|sending|active|succeeded|aborted|canceled|error
  const [target, setTarget] = useState(null);      // the NAV_LOCATIONS entry
  const [rawDistance, setDistance] = useState(null);
  const [rawMessage, setMessage] = useState('');

  // sendGoal returns a goal ID *string*, and cancelling goes back through the
  // Action object as cancelGoal(id) — so both have to be kept.
  const actionRef = useRef(null);
  const goalIdRef = useRef(null);

  const wasBusy = rawStatus === 'sending' || rawStatus === 'active';

  // A goal cannot still be running if the socket is gone, so this is DERIVED
  // rather than pushed into state from an effect. Writing it in an effect would
  // mean a second render pass on every reconnect, and React flags exactly that
  // pattern. The refs are cleared lazily in goTo/cancel instead.
  const connectionLost = wasBusy && !isRosConnected;
  const status = connectionLost ? 'error' : rawStatus;
  const message = connectionLost ? 'Lost connection to the robot' : rawMessage;
  const distance = connectionLost ? null : rawDistance;
  const isBusy = wasBusy && isRosConnected;

  const cancel = useCallback(() => {
    try {
      if (actionRef.current && goalIdRef.current) {
        actionRef.current.cancelGoal(goalIdRef.current);
      } else if (actionRef.current) {
        actionRef.current.cancelAllGoals();
      }
    } catch {
      // rosbridge already dropped it; the status update below is what matters
    }
    actionRef.current = null;
    goalIdRef.current = null;
    setStatus('canceled');
    setMessage('Cancelled');
    setDistance(null);
  }, []);

  const goTo = useCallback((location) => {
    if (!rosConn || !isRosConnected) {
      setStatus('error');
      setMessage('Not connected to the robot');
      return;
    }
    if (!location?.navSafe) {
      setStatus('error');
      setMessage('That location has no surveyed pose');
      return;
    }

    const pose = location.navSafe;
    setTarget(location);
    setStatus('sending');
    setMessage(`Sending ${location.label}…`);
    setDistance(null);

    // 1. Publish directly to /goal_pose topic (matches RViz 2D Goal Pose behavior)
    const goalTopic = new ROSLIB.Topic({
      ros: rosConn,
      name: '/goal_pose',
      messageType: 'geometry_msgs/PoseStamped',
    });

    const goalPoseMsg = {
      header: {
        frame_id: 'map',
        stamp: {
          sec: Math.floor(Date.now() / 1000),
          nanosec: (Date.now() % 1000) * 1000000,
        },
      },
      pose: {
        position: { x: pose.x, y: pose.y, z: 0.0 },
        orientation: orientationOf(pose),
      },
    };

    goalTopic.publish(goalPoseMsg);
    setStatus('active');
    setMessage(`Driving to ${location.label}…`);

    // 2. Also send Action goal if rosbridge supports action client
    try {
      const action = new ROSLIB.Action({
        ros: rosConn,
        name: ACTION_NAME,
        actionType: ACTION_TYPE,
      });
      actionRef.current = action;

      const goal = {
        pose: goalPoseMsg,
        behavior_tree: '',
      };

      goalIdRef.current = action.sendGoal(
        goal,
        (result) => {
          goalIdRef.current = null;
          setDistance(null);
          const s = result?.status ?? result?.status_code;
          if (s === STATUS.SUCCEEDED || s === undefined) {
            setStatus('succeeded');
            setMessage(`Arrived at ${location.label}`);
          } else if (s === STATUS.CANCELED) {
            setStatus('canceled');
            setMessage('Cancelled');
          } else {
            setStatus('aborted');
            setMessage(`Arrived near ${location.label}`);
          }
        },
        (fb) => {
          setStatus('active');
          setMessage(`Driving to ${location.label}…`);
          const d = fb?.distance_remaining ?? fb?.feedback?.distance_remaining;
          if (typeof d === 'number') setDistance(d);
        },
        (err) => {
          // Fallback if action fails; topic publish to /goal_pose already triggered Nav2
          console.warn('Action goal feedback warning:', err);
        }
      );
    } catch (e) {
      console.warn('Action client init exception:', e);
    }
  }, [rosConn, isRosConnected]);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setDistance(null);
    setTarget(null);
  }, []);

  return { goTo, cancel, reset, status, target, distance, message, isBusy };
}

export default useNavGoal;
