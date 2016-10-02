### users:
    events:
    * user_disconnect 
        - parameters:
        1) username - username of user that you want to disconnect
        
    * message_to_user
        - parameters:
        1) message - message content
        2) to - destination username
        
    * message_to_room
        - parameters:
        1) message - message content
        2) to - destination room
        
    sources:
        user_list - return list of all users

### rooms:
    events:
    * room_create
        - parameters:
        1) room_name
    * room_remove
        - parameters:
        1) room_name
    * room_join
        - parameters:
        1) room_name
    * room_change
        - parameters:
        1) room_name