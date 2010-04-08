# Allow the metal piece to run in isolation

require(File.dirname(__FILE__) + "/../../config/environment") unless defined?(Rails)


class AspchatMetal  
  
  def self.call(env)
    request = Rack::Request.new(env)
    response = Rack::Response.new
    response['Cache-Control']='no-cache'
    
    begin
      if request.path_info =~ /^\/aspchat\/messages/ && login?(env) #&& request.xhr? #XXX
        user_id=self.current_user(env)
        nickname=self.current_nickname(env)
        raise("404") if nickname.blank?

        max_timestamp = AspchatStore.timestamp(Rails.env=='development' ? 60 : 20)
        
        #if there's a token, it means the user list was recently expired, if not, we open a thread to expire it now and reset the token
        
        # expiring_thread = AspchatStore.expiry_token ? nil : Thread.new {AspchatStore.expire_users(Rails.env=='development' ? 90 : 10)}
        AspchatStore.expiry_token ? nil : AspchatStore.expire_users(Rails.env=='development' ? 90 : 10)

        if request.get?
          messages = Array.new #the object where we will return the messages for the user          
          channel_list=request.GET['channels']
          channels=channel_list.blank? ? Array.new : channel_list.split(',') rescue nil
          channels << user_id #always check for the private channel for the user         
          
          channels.each do |channel|
            messages += AspchatStore.backend_get_messages(channel) || []
            if messages.reject!{|m| m[:id] < max_timestamp}
              AspchatStore.backend_store_messages(channel, messages )
            end
          end
          
          response['content-type']='application/json'
          response.write messages.compact.sort_by(&:id).reverse.to_json
          AspchatStore.backend_register_polling_user(user_id, nickname)
          
        elsif request.post?
          channel=request.POST['to']
          message=request.POST['message']
          
          raise("404") if channel.blank? || message.blank?  
         
          AspchatStore.backend_send_message(channel, message, nickname, user_id, request.POST['resource'] )
        end

        #in case a expiration thread is working in parallel, we have to wait until it finishes
        # expiring_thread.join if expiring_thread 
          
        #      by now we don't need the user list polling to be via metal, so we won't control it here
        #      elsif request.path_info =~ /^\/aspchat\/users/ && login?(env) && request.xhr?
        #          polling_users = AspchatStore.get_polling_users
        #          response['content-type']='application/json'
        #          response.write polling_users.to_json
      else
        # raise
        response.status=404
      end
    rescue Exception => e
      Rails.logger.error "#{ e.message } - (#{ e.class })" << "\n" << (e.backtrace or []).join("\n")
      response.write "Not Found"      
      response.status=404      
    end
        
    response.to_a
  end  
  
  def self.login?(env)
    !self.current_user(env).blank?
  end
  
  def self.current_user(env)
    env['rack.session'][:user_id]
  end
  
  def self.current_nickname(env)
    env['rack.session'][:nickname]
  end
  
  
  
  
end
