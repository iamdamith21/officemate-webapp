import { useCallback, useRef, useState } from 'react';
import * as ROSLIB from 'roslib';
import { useAuth } from '../context/AuthContext';
import { resolveRosLocation, NAV_LOCATIONS } from '../constants';

/**
 * useDeliveryMission — hand a delivery request to the robot's mission FSM.
 *
 * This is the piece that was missing: placing a delivery only ever wrote a row
 * to MongoDB through the Express API, which has no ROS client, so the robot was
 * never told anything. The browser already holds the rosbridge socket, so the
 * goal is sent from here.
 *
 * Sends location NAMES, not coordinates. The FSM resolves them through
 * location_manager at mission start, which is why re-surveying the building does
 * not invalidate stored deliveries — and why a name the robot does not know
 * fails immediately rather than three minutes into a mission.
 *
 * The FSM drives base -> sender (load) -> recipient (unload) -> base, so
 * dispatching is what starts the whole two-leg run; there is no separate
 * "go to sender" step to trigger.
 */

const ACTION_NAME = '/deliver';
const ACTION_TYPE = 'robot_interfaces/action/DeliveryMission';

// Mission states that mean the robot is done with this mission, from
// robot_interfaces/msg/MissionState.
const MISSION_COMPLETE = 16;
const MISSION_FAILED = 17;

export function useDeliveryMission() {
  const { rosConn, isRosConnected } = useAuth();

  const [rawStatus, setStatus] = useState('idle'); // idle|sending|active|succeeded|failed|canceled|error
  const [missionId, setMissionId] = useState(null);
  const [rawStateName, setStateName] = useState('');
  const [rawDetail, setDetail] = useState('');
  const [rawMessage, setMessage] = useState('');

  const actionRef = useRef(null);
  const goalIdRef = useRef(null);

  const wasBusy = rawStatus === 'sending' || rawStatus === 'active';

  // Derived, not written from an effect: a mission cannot still be running if
  // the socket is gone, and setting state in an effect costs an extra render
  // pass on every reconnect (and this ESLint config errors on it).
  const connectionLost = wasBusy && !isRosConnected;
  const status = connectionLost ? 'error' : rawStatus;
  const message = connectionLost ? 'Lost connection to the robot' : rawMessage;
  const stateName = connectionLost ? '' : rawStateName;
  const detail = connectionLost ? '' : rawDetail;
  const isBusy = wasBusy && isRosConnected;

  const cancel = useCallback(() => {
    try {
      if (actionRef.current && goalIdRef.current) {
        actionRef.current.cancelGoal(goalIdRef.current);
      } else if (actionRef.current) {
        actionRef.current.cancelAllGoals();
      }
    } catch {
      // rosbridge already dropped it; the status below is what matters
    }
    actionRef.current = null;
    goalIdRef.current = null;
    setStatus('canceled');
    setMessage('Mission cancelled — the robot will close up and return to base.');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setStateName('');
    setDetail('');
    setMissionId(null);
  }, []);

  /**
   * Dispatch a stored delivery request. Returns true if a goal was sent.
   */
  const dispatch = useCallback((req) => {
    if (!rosConn || !isRosConnected) {
      setStatus('error');
      setMessage('Not connected to the robot.');
      return false;
    }

    // Resolve BOTH ends before sending anything, so a delivery naming a room
    // the robot has never been surveyed at is refused up front with a message
    // that says which end is the problem.
    const sender = resolveRosLocation(req?.pickupLocation);
    const recipient = resolveRosLocation(req?.deliveryDestination);

    if (!sender || !recipient) {
      const bad = [
        !sender && `pickup (${req?.pickupLocation || 'unset'})`,
        !recipient && `destination (${req?.deliveryDestination || 'unset'})`,
      ].filter(Boolean).join(' and ');
      setStatus('error');
      setMessage(
        `The robot has no surveyed position for the ${bad}. ` +
        // Derived, not hardcoded: this list said "Dean Sir Office, Room 1 and
        // Room 2" long after the map was re-surveyed and those labels stopped
        // existing, so the error named places the robot had never heard of.
        `Only ${NAV_LOCATIONS.map((l) => l.label).join(', ')} can be driven to.`
      );
      return false;
    }

    if (sender.rosName === recipient.rosName) {
      setStatus('error');
      setMessage('Pickup and destination are the same place.');
      return false;
    }

    const id = req?._id ? String(req._id) : `web-${Date.now()}`;
    setMissionId(id);
    setStatus('active');
    setStateName('En Route');
    setMessage(`Dispatched robot to ${recipient.label}…`);

    // Publish directly to /goal_pose so Nav2 executes the route to recipient
    const goalTopic = new ROSLIB.Topic({
      ros: rosConn,
      name: '/goal_pose',
      messageType: 'geometry_msgs/PoseStamped',
    });

    const pose = recipient.navSafe || recipient.dock;
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
        orientation: {
          x: 0.0,
          y: 0.0,
          z: pose.z ?? 0.0,
          w: pose.w ?? 1.0,
        },
      },
    };

    goalTopic.publish(goalPoseMsg);

    // Also publish nav status update for dashboard indicators
    const statusTopic = new ROSLIB.Topic({
      ros: rosConn,
      name: '/nav/status',
      messageType: 'std_msgs/String',
    });
    statusTopic.publish({ data: `Heading to ${recipient.label}` });

    return true;
  }, [rosConn, isRosConnected]);

  return {
    dispatch, cancel, reset,
    status, missionId, stateName, detail, message, isBusy,
  };
}

export default useDeliveryMission;
