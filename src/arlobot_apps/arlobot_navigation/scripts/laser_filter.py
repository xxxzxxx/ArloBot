#!/usr/bin/env python
import rospy
from sensor_msgs.msg import LaserScan
import math

def callback(data):
#Option 1) Conform data to specified input/output ranges
    #data.ranges  = [data.range_max if range_val>data.range_max else (data.range_min if range_val<data.range_min else range_val) for range_val in data.ranges]
    data.ranges  = [data.range_max if range_val>data.range_max else (0.0 if range_val<data.range_min else range_val) for range_val in data.ranges]
#Option 2) Conform input/output ranges to data
    data.range_max = max(data.range_max,max(data.ranges))
    data.range_min = min(data.range_min,min(data.ranges))
    pub.publish(data)

# Intializes everything
def start():
    rospy.init_node('laser_filter')
    scan_topic = rospy.get_param('~scan_topic', 'scan')
    global pub
    pub = rospy.Publisher(scan_topic+'_filtered', LaserScan, queue_size=10)
    rospy.Subscriber(scan_topic, LaserScan, callback)
    rospy.spin()

if __name__ == '__main__':
    start()
