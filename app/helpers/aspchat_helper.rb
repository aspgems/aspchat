module AspchatHelper
  
  #returns a hash in which the user_id is the key containing another hash like
  #   1=>{:nickname=>"admin"}, 9=>{:nickname=>"user"}}  
  def aspchat_polling_users
    AspchatStore.get_polling_users
  end  
  
  #returns a hash in which the key is the nickname and the value is the user_id like
  #   'admin'=>1, 'user'=>9  
  def aspchat_users_by_nickname
    polling_users=aspchat_polling_users
    nicknames=Hash.new
    polling_users.each_pair do |user_id, user_object|
      nicknames[user_object[:nickname]]=user_id
    end
    return nicknames
  end
  
  def aspchat_connected?
    session[:aspchat_offline].blank?
  end
  
end