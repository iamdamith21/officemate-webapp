# Components

The OfficeMate autonomous delivery robot is built around a two-tier compute architecture (a Raspberry Pi 4 for high-level autonomy and an Arduino Mega 2560 for real-time actuation and sensing) supported by a set of sensors, actuators, power-management modules, and a user-interaction module. Each component was selected after comparing it against common alternatives, weighing cost, accuracy, ease of integration with the rest of the stack, and community/library support. This section describes every hardware component used, its role within the robot, and the justification for choosing it over the alternatives that were considered.

## 1. LTME-02A 2D LiDAR Sensor

**Description:** The LTME-02A is a 360° rotating 2D LiDAR (Light Detection and Ranging) module that uses time-of-flight laser ranging to measure distances to surrounding obstacles and outputs a full-circle point cloud several times per second.

**Functionality within the project:** The LiDAR is the robot's primary spatial-awareness sensor. It feeds real-time distance/angle data to the Raspberry Pi, which uses it for obstacle detection, dynamic path planning, and mapping of corridors and office spaces as the robot navigates between delivery points. It provides far greater range and angular resolution than the ultrasonic sensor, making it the main input for autonomous navigation and collision avoidance.

**Reason for choosing over alternatives:** Camera-based (visual SLAM) navigation was considered but rejected because it requires significantly more processing power and is more sensitive to lighting conditions typical of office corridors (glare, low light). A single fixed ultrasonic array was also considered, but it cannot provide a full 360° map and has much lower angular resolution, leading to blind spots. The LTME-02A offers a good balance of range, accuracy, and cost for an indoor delivery robot, and produces a scan format that is straightforward to consume for mapping/navigation stacks (e.g., ROS-style occupancy grids), which the ultrasonic-only or camera-only alternatives could not match at a comparable price point.

## 2. Raspberry Pi 4 Model B Micro-Computer

**Description:** A single-board computer running a full Linux OS, with a quad-core ARM Cortex-A72 processor, up to 8 GB of RAM, and native networking (Wi-Fi/Ethernet) and USB interfaces.

**Functionality within the project:** The Raspberry Pi acts as the robot's high-level "brain." It processes LiDAR scan data, runs the navigation and path-planning logic, communicates with the OfficeMate backend/web application over Wi-Fi to receive delivery jobs and report status, and sends movement/task commands down to the Arduino Mega over serial (UART/USB). Its networking capability is what allows the robot to be dispatched and tracked from the web application.

**Reason for choosing over alternatives:** Microcontroller-only designs (e.g., running everything on the Arduino Mega alone) were ruled out because the Mega cannot run an OS, a network stack, or computationally heavier navigation algorithms. Other single-board computers (e.g., NVIDIA Jetson Nano, BeagleBone) were considered; the Jetson offers stronger GPU-based AI performance but at higher cost and power draw that was not justified since the design relies on LiDAR-based navigation rather than heavy computer vision/ML inference. The Raspberry Pi 4 was chosen for its balance of processing power, low cost, large community/library support (Python networking, serial, and robotics libraries), and low power consumption suitable for battery operation.

## 3. Arduino Mega 2560 Micro-Controller

**Description:** An 8-bit AVR-based microcontroller board with 54 digital I/O pins, multiple hardware serial ports, and analog inputs.

**Functionality within the project:** The Mega handles all low-level, real-time tasks: reading the ultrasonic, IMU, IR, and current sensors; driving the motor driver (L298N) and servo; interfacing with the LCD and RFID reader; and executing motion commands received from the Raspberry Pi. Offloading these time-critical, deterministic tasks to the Mega keeps the Raspberry Pi free to focus on navigation and communication.

**Reason for choosing over alternatives:** A smaller board such as the Arduino Uno was considered but has too few I/O pins and only one hardware serial port, which would be insufficient given the number of sensors and modules (LCD, RFID, IMU, current sensor, ultrasonic, IR, servo, and motor driver all need to be interfaced simultaneously). The Mega 2560's larger pin count, multiple serial ports, and ample memory made it easy to wire and control every peripheral directly without needing external multiplexers, while still being inexpensive and well documented compared to running everything through the Raspberry Pi's GPIO (which lacks the same real-time determinism and analog input support).

## 4. INA219 Current Sensor Module

**Description:** A high-side, bidirectional current/power monitoring IC that measures voltage, current, and power draw over an I2C interface.

**Functionality within the project:** The INA219 continuously monitors the battery pack's current draw and voltage, allowing the system to track power consumption, estimate remaining battery life, and flag abnormal current draw (e.g., a stalled motor or short circuit) so the robot can pause or return to a charging point before power runs out.

**Reason for choosing over alternatives:** A simple analog voltage divider could estimate battery voltage but cannot measure current draw, making runtime/health estimation far less accurate. Shunt-resistor-plus-op-amp designs were considered but require more manual calibration and extra components. The INA219 was chosen because it is a single, low-cost, pre-calibrated I2C module with existing Arduino libraries, giving accurate current and power readings with minimal wiring and no manual calibration.

## 5. MPU6050 IMU Sensor Module

**Description:** A 6-axis inertial measurement unit combining a 3-axis accelerometer and a 3-axis gyroscope on a single I2C chip.

**Functionality within the project:** The MPU6050 provides orientation and motion data (tilt, acceleration, rotational rate) that supplements LiDAR-based navigation with dead-reckoning information. It helps the robot detect if it has tipped, is on an incline/ramp, or has drifted off its intended heading, improving the accuracy of turns and straight-line travel between LiDAR updates.

**Reason for choosing over alternatives:** A magnetometer-only compass module was considered but is prone to interference from motors and metal structures inside an office building, making heading data unreliable. A full 9-axis IMU (adding a magnetometer) was also considered but was not necessary given that LiDAR already provides absolute positioning cues indoors, so the added cost and complexity of fusing magnetometer data were not justified. The MPU6050 was selected as a cost-effective, widely supported module that provides sufficient orientation data for short-term motion correction between LiDAR scans.

## 6. HC-SR04 Ultrasonic Sensor Module

**Description:** An ultrasonic distance sensor that emits a sound pulse and measures the time for its echo to return, giving a short-range distance reading (typically a few centimeters to a few meters).

**Functionality within the project:** The HC-SR04 acts as a close-range collision-safety backup, mounted to detect obstacles directly in the robot's path (such as low objects, feet, or furniture edges) that may fall outside the LiDAR's scan plane. It triggers immediate stop/avoidance behavior at short range, complementing the LiDAR's wider but pricier long-range sensing.

**Reason for choosing over alternatives:** Relying on the LiDAR alone was considered insufficient because it scans at a fixed height and can miss low-lying obstacles. Infrared distance sensors (e.g., Sharp IR rangefinders) were considered as an alternative but are less reliable on dark or reflective surfaces common in office flooring. The HC-SR04 was chosen for its low cost, simple digital trigger/echo interface, and reliable short-range performance regardless of surface color, making it an effective low-cost redundant safety layer.

## 7. 20x4 LCD Display with I2C Connector Module

**Description:** A character LCD screen (20 columns × 4 rows) with an I2C backpack that reduces the wiring to just two data lines (SDA/SCL) plus power.

**Functionality within the project:** The LCD provides on-device status feedback, displaying information such as current delivery task, destination, battery level, or error/status messages directly on the robot, so staff nearby can see what the robot is doing without needing to check the web application.

**Reason for choosing over alternatives:** A smaller 16x2 LCD was considered but does not have enough space to show multi-line status messages (e.g., task name and destination together). A graphical OLED/TFT display was also considered for richer visuals, but it requires more processing overhead and a more complex driver library for relatively little functional benefit in this use case. The 20x4 I2C LCD was chosen because it offers enough display area for the needed status information while using only two GPIO pins (via I2C), keeping wiring simple on the already pin-constrained Mega.

## 8. MFRC522 RFID Reader Module

**Description:** A 13.56 MHz RFID/NFC reader-writer module communicating over SPI, capable of reading passive RFID tags/cards.

**Functionality within the project:** The RFID reader is used for delivery confirmation and/or access control — for example, verifying an RFID-tagged office/room location or authenticating a staff member picking up a delivered item, ensuring the robot logs deliveries accurately and only to authorized recipients.

**Reason for choosing over alternatives:** A barcode/QR-code scanner with a camera was considered but requires more processing power and consistent lighting/line-of-sight to scan reliably, which is less practical for quick tap-based confirmation at an office door. NFC via a smartphone-only approach was also considered but would exclude simple passive-tag identification at fixed locations. The MFRC522 was selected for being an inexpensive, low-power, well-documented SPI module that provides fast and reliable tag reads without requiring cameras or line-of-sight alignment.

## 9. IR Infrared Sensor Module

**Description:** An infrared proximity/line-detection sensor that emits IR light and detects reflection to sense nearby objects or contrast (e.g., line markings) at short range.

**Functionality within the project:** The IR sensor is used for close-proximity detection tasks such as line/edge-following along marked corridor paths or detecting the presence of an object/step-off hazard immediately in front of or beneath the robot, adding another layer of low-level safety and guidance alongside the ultrasonic sensor.

**Reason for choosing over alternatives:** A camera-based line-following system was considered but adds unnecessary image-processing overhead for a task that is inherently simple (detecting contrast/reflectance). Mechanical bump/limit switches were also considered for edge detection but only trigger after contact, offering no early warning. The IR module was chosen because it is inexpensive, has a fast digital response, and detects obstacles/line edges before physical contact occurs, at negligible cost and complexity.

## 10. SG90 Servo Motor

**Description:** A small, lightweight hobby servo motor capable of precise angular positioning (typically 0°–180°) controlled via a PWM signal.

**Functionality within the project:** The SG90 is used for a mechanical actuation task such as opening/closing a delivery compartment lid or actuating a small locking/latch mechanism, allowing the robot to securely hold and release delivered items automatically at the destination.

**Reason for choosing over alternatives:** A DC motor with a gearbox was considered for the same latch/lid mechanism, but DC motors require additional position feedback (e.g., encoders or limit switches) to achieve precise open/close positioning, adding cost and firmware complexity. A solenoid actuator was also considered but only provides two discrete positions (open/closed) with a less controlled motion and a higher current draw. The SG90 was chosen because it provides accurate, repeatable angular control out of the box with a simple PWM interface, and its low torque requirement is more than sufficient for actuating a lightweight compartment lid.

## 11. XL4015 DC-DC Buck Converter

**Description:** A high-current step-down (buck) switching regulator module that converts a higher input voltage (e.g., from the battery pack) down to a stable, adjustable lower output voltage.

**Functionality within the project:** The XL4015 steps down the raw battery pack voltage to the stable voltage levels required by the motor driver, microcontrollers, and sensor modules, ensuring all electronics receive clean, regulated power regardless of fluctuations in battery voltage as it discharges.

**Reason for choosing over alternatives:** A linear voltage regulator (e.g., LM7805) was considered but dissipates excess voltage as heat and is inefficient at the higher current levels drawn by the drive motors, risking overheating and wasted battery capacity. Using the battery's raw voltage directly was not viable since it would exceed the safe input range of the logic-level components. The XL4015 was selected because switching regulation is far more power-efficient than linear regulation at these current levels, extending battery life, and its adjustable output makes it easy to supply the exact voltages needed by different subsystems.

## 12. DC Gear Motor (100 RPM)

**Description:** A brushed DC motor combined with a reduction gearbox that outputs a lower, more usable rotational speed (100 RPM) with increased torque compared to the bare motor.

**Functionality within the project:** These motors (typically one per drive wheel) provide the drive train that physically moves the robot forward, backward, and through turns (via differential steering), driven through the L298N motor driver under commands from the Arduino Mega.

**Reason for choosing over alternatives:** Stepper motors were considered for more precise positional control, but they are heavier, more expensive, and draw more current for holding torque than is needed for a wheeled mobile robot that primarily needs continuous rotation rather than precise step positioning. A high-RPM motor without a gearbox was also considered but would spin the wheels too fast for controlled indoor navigation and would lack the torque to reliably move the robot's chassis and payload. The 100 RPM geared DC motor was chosen because its gearbox provides the torque needed to move the robot's weight at a safe, controllable indoor speed, and it integrates simply with a standard H-bridge driver.

## 13. L298N Motor Driver Module

**Description:** A dual H-bridge motor driver module that can control the speed and direction of two DC motors from low-power logic signals.

**Functionality within the project:** The L298N sits between the Arduino Mega and the drive motors, taking PWM/direction signals from the Mega and switching the higher-current, higher-voltage power needed to drive the DC gear motors, enabling forward/reverse/turning motion.

**Reason for choosing over alternatives:** Driving the motors directly from the microcontroller pins is not possible since Arduino GPIO pins cannot supply the current required by DC motors and could damage the board. More advanced MOSFET-based drivers (e.g., BTS7960) were considered for higher efficiency and current capacity, but the DC gear motors used here do not draw enough current to need them, making the extra cost unnecessary. The L298N was chosen as a well-established, low-cost, dual-channel H-bridge that is more than adequate for driving the two 100 RPM gear motors and has extensive library and tutorial support for Arduino.

## 14. 18650 3S Battery Pack

**Description:** A rechargeable lithium-ion battery pack made of three 18650 cells connected in series (3S configuration), providing a nominal ~11.1 V main power source with high energy density.

**Functionality within the project:** This pack is the primary power source for the robot's motors and higher-current electronics (via the XL4015 buck converter), chosen for its ability to sustain the current draw needed by the drive motors over a full delivery run.

**Reason for choosing over alternatives:** A standard alkaline or NiMH battery pack was considered but offers lower energy density and cannot be recharged as conveniently or as many times as lithium-ion cells, increasing long-term running costs. A single-cell (1S) LiPo was also considered but would not provide sufficient voltage for the motor driver and buck converter without additional boost circuitry. The 3S 18650 pack was selected because it offers a good balance of voltage, capacity, rechargeability, and physical robustness (18650 cells are cylindrical and well-protected) for powering the motors and drive electronics.

## 15. 10,000 mAh Power Bank

**Description:** A USB-output rechargeable lithium battery pack designed to supply stable 5 V power to USB-powered devices.

**Functionality within the project:** The power bank supplies dedicated, isolated power to the Raspberry Pi 4, ensuring the compute unit (and its Wi-Fi connectivity to the OfficeMate backend) stays powered independently of the motor power system, which experiences voltage dips and electrical noise from motor switching.

**Reason for choosing over alternatives:** Powering the Raspberry Pi from the same XL4015-regulated line as the motors was considered but risks brownouts and reboots of the Pi when the motors draw sudden current spikes, which would be highly disruptive since the Pi handles navigation and communication. A separate custom-built 5 V regulator off the main battery pack was also considered, but the 10,000 mAh power bank was chosen instead because it is an off-the-shelf, pre-protected (over-discharge/over-current) 5 V/USB source that electrically isolates the Pi's power supply from motor noise, is easy to recharge/swap, and provides ample capacity for a full operating day.

## Summary

| # | Component | Primary Role |
|---|-----------|---------------|
| 1 | LTME-02A 2D LiDAR | Long-range obstacle mapping & navigation |
| 2 | Raspberry Pi 4 Model B | High-level compute, navigation logic, network/backend communication |
| 3 | Arduino Mega 2560 | Real-time sensor reading & actuator control |
| 4 | INA219 Current Sensor | Battery current/power monitoring |
| 5 | MPU6050 IMU | Orientation & motion sensing |
| 6 | HC-SR04 Ultrasonic Sensor | Short-range collision safety |
| 7 | 20x4 I2C LCD | On-device status display |
| 8 | MFRC522 RFID Reader | Delivery/identity confirmation |
| 9 | IR Sensor | Close-range/line/edge detection |
| 10 | SG90 Servo Motor | Compartment lid/latch actuation |
| 11 | XL4015 Buck Converter | Voltage regulation for electronics |
| 12 | DC Gear Motor (100 RPM) | Drive-wheel propulsion |
| 13 | L298N Motor Driver | Motor speed/direction control |
| 14 | 18650 3S Battery Pack | Main power source (motors & drivers) |
| 15 | 10,000 mAh Power Bank | Isolated power source for Raspberry Pi |
