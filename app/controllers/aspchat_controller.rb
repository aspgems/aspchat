class AspchatController < ApplicationController
  protect_from_forgery :except=>:users
      
  def users
    render :nothing=>true, :status=>404 and return unless session[:user_id] && request.xhr?
    render :layout=>false    
  end
  
  def toggle_connect
    if params[:online]=="true"
      session[:aspchat_offline]=true
      render :partial => 'aspchat_inline_connect'        
    else
      session[:aspchat_offline]=nil
      render :partial => 'aspchat_inline_disconnect'
    end
  end
end
