if [[ $# -ne 1 ]]
then
echo 'Please provide a map name on the command line.'
else
/opt/ros/indigo/bin/rosrun map_server map_saver -f ~/.arlobot/rosmaps/${1}
fi

