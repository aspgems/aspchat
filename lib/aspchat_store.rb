#memcached should be configured elsewhere, probably on environment or an initializer
module AspchatStore
  KEY_PREF="aspchat::"
  POLLING_USERS_KEY_PREF="#{KEY_PREF}polling::"
  
  def AspchatStore.backend_get_messages(channel)
    Cache.get("#{KEY_PREF}_#{get_channel_name(channel)}")
  end
  
  def AspchatStore.backend_send_message(channel, message, nickname, user_id, resource )     
     stanza = Hash.new
     stanza[:id]=AspchatStore.timestamp
     stanza[:channel]=private_message?(channel) ? nil : channel;
     stanza[:message]=message
     stanza[:nickname]=nickname
     stanza[:user_id]=user_id
     stanza[:resource]=resource
          
     log=backend_get_messages(channel)
     log = Array.new unless log.is_a? Array
     log << stanza
          
     AspchatStore.backend_store_messages(channel, log )
  end
  
  def AspchatStore.backend_store_messages(channel, messages )
    Cache.put "#{KEY_PREF}_#{get_channel_name(channel)}", messages
  end
  
  def AspchatStore.reset_expiry_token(offset=15)
     Cache.put "#{KEY_PREF}_expiry_token", true, offset 
  end
  
  def AspchatStore.expiry_token
     Cache.get("#{KEY_PREF}_expiry_token")
  end
  
  def AspchatStore.backend_register_polling_user(user_id, nickname)
      connected_user = AspchatStore.get_polling_user(user_id)
      if connected_user.blank? || connected_user[:nickname] != nickname
        polling_users = AspchatStore.get_polling_users 
        polling_users[user_id]={:nickname=>nickname}        
        AspchatStore.set_polling_users polling_users  
      end
      
      AspchatStore.set_polling_user(user_id, {:nickname=>nickname, :last_seen=>AspchatStore.timestamp} )
  end
  
  def AspchatStore.expire_users(offset=10)
    max_timestamp = AspchatStore.timestamp(offset) #all contents older than 
    expired_users=Array.new
    polling_users=AspchatStore.get_polling_users
    polling_users.each_key do |user_id|
      polling_user = AspchatStore.get_polling_user(user_id)
      expired_users << user_id if !polling_user || polling_user[:last_seen] <  max_timestamp
    end
    polling_users=AspchatStore.get_polling_users
    expired_users.each{|user_id| polling_users.delete(user_id) }
    AspchatStore.set_polling_users polling_users
    expired_users.each{|user_id| AspchatStore.delete_polling_user(user_id)}    
    AspchatStore.reset_expiry_token
  end
  
  def AspchatStore.get_polling_user(user_id)
    Cache.get("#{POLLING_USERS_KEY_PREF}#{user_id}")
  end
  
  def AspchatStore.set_polling_user(user_id, data)
    Cache.put "#{POLLING_USERS_KEY_PREF}#{user_id}", data  
  end
  
  def AspchatStore.delete_polling_user(user_id)
    Cache.delete "#{POLLING_USERS_KEY_PREF}#{user_id}"  
  end
  
  def AspchatStore.get_polling_users
    Cache.get("#{POLLING_USERS_KEY_PREF}_users_") || Hash.new
  end
  
  def AspchatStore.set_polling_users(polling_users)
    Cache.put "#{POLLING_USERS_KEY_PREF}_users_", polling_users
  end
  
  def AspchatStore.timestamp(offset=nil)
    time=Time.now
    time -= offset.seconds if offset
    (time.to_f * 1000000 ).to_i
  end  
  
  def AspchatStore.private_message?(channel)
    channel.to_i != 0
  end
  
  def AspchatStore.get_channel_name(to)
    return nil if to.blank?
    #if the "to" param is a number, it represents the user_id. If it's a String, it's a room name
    AspchatStore.private_message?(to) ? "user_#{to}" : "room_#{to}" 
  end
end