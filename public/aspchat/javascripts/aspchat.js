/**
 * @author aspgems
 */
var Aspchat = new Object();

Aspchat.message_max_id = null;
Aspchat.current_channel = null;
Aspchat.current_channel_div = null;
Aspchat.poller_object = null;
Aspchat.user_list_poller_object = null;
Aspchat.resource = Math.floor(100 * Math.random()) //random number between 0 and 99
Aspchat.nickname = "you";
Aspchat.online=true;
Aspchat.channelList= new Hash();

Aspchat.polling_interval = 3;		//interval for messages updates
Aspchat.polling_list_interval = 15; //interval for user list updates


Aspchat.displayChatMessages = function(messages){
    if (messages.size == 0) 
        return;
    
    messages.each(function(message){
        Aspchat.displayChatMessage(message);
    });
}

Aspchat.buildMessageFromSelf = function(message){
    return {
        id: null,
        nickname: Aspchat.nickname,
        resource: Aspchat.resource,
        message: message,
        from_self: true
        //channel: Aspchat.current_channel
    };
}

Aspchat.displaySelfMessage = function(){
    message = Aspchat.buildMessageFromSelf($('chat-input-area-form')['message'].value);
    Aspchat.current_channel_div.insert(Aspchat.messageText(message));
    Aspchat.current_channel_div.scrollTop = Aspchat.current_channel_div.scrollHeight;
    Aspchat.chatResetMessageArea();
}

Aspchat.messageText = function(message){
    msg_template = new Template('<strong>#{nickname}</strong>:#{message}<br/>');
    return msg_template.evaluate(message);
}

Aspchat.displayChatMessage = function(message){
    if (!message['id'] || !Aspchat.message_max_id || Aspchat.message_max_id < message['id']) {
    
        channel_tab = Aspchat.getChannelTab(message);
        channel_div = Aspchat.getChannelDiv(message);
        
        channel_div.insert(Aspchat.messageText(message));
        channel_div.scrollTop = channel_div.scrollHeight;
        
        //if the message comes from the server. If not, we don't need to notify of the unread status
        if (message['id']) {
            Aspchat.chatMarkChannelAsUnread(channel_tab);
            Aspchat.message_max_id = message['id'];
        }
    }
}

Aspchat.chatMarkChannelAsUnread = function(channel_tab){
    channel_tab.addClassName('unread');
}

Aspchat.chatMarkChannelAsRead = function(channel_tab){
    channel_tab.removeClassName('unread');
}

Aspchat.chatSetActiveChannel = function(tab_id, channel, user_id){	
    Aspchat.current_channel = user_id ? user_id : channel;
    Aspchat.current_channel_div = $(Aspchat.getChannelDivIdFromName(channel));
    
    Aspchat.chatHideAllChannels();
    Aspchat.current_channel_div.setStyle({
        display: 'block'
    });
    $('chat-input-area').setStyle({
        display: 'block'
    });
    
    tab_object = $(Aspchat.getChannelTabIdFromName(channel));
    Aspchat.chatMarkChannelAsRead(tab_object);
    Aspchat.chatMarkAllChannelsInactive();
    $(tab_id).addClassName('current');
}

Aspchat.chatRemoveChannel = function(tab_id, channel){
    Aspchat.chatHideAllChannels();
    
    Aspchat.current_channel_div = $(Aspchat.getChannelDivIdFromName(channel));
    Aspchat.current_channel_div.remove();
    tab_object = $(Aspchat.getChannelTabIdFromName(channel));
    tab_object.remove();
	Aspchat.channelList.unset(tab_id);
}

Aspchat.removeAllChannels = function () {
	Aspchat.channelList.each(function(pair) {
  		Aspchat.chatRemoveChannel(pair.key, pair.value);
	});

}

Aspchat.chatMarkAllChannelsInactive = function(){
    $$('#chat-channel-list li.channel').each(function(channel){
        channel.removeClassName('current');
    });
}

Aspchat.getChannelTab = function(message){
    tab_id = Aspchat.getChannelTabId(message);
    if (Aspchat.chatIsPrivateMessage(message)) {
        return Aspchat.createChannelTab(Aspchat.getChannelName(message), message['user_id']);
    }
    else {
        return Aspchat.createChannelTab(Aspchat.getChannelName(message));
    }
}

Aspchat.getChannelDiv = function(message){
    div_id = Aspchat.getChannelDivId(message);
    return Aspchat.createChannelDiv(Aspchat.getChannelName(message));
    
}

Aspchat.getChannelTabIdFromName = function(chan_name){
    return 'chat-channel-' + chan_name;
}

Aspchat.getChannelTabId = function(message){
    return Aspchat.getChannelTabIdFromName(Aspchat.getChannelName(message));
}

Aspchat.getChannelDivIdFromName = function(chan_name){
    return 'chat-channel-' + chan_name + "-content";
}

Aspchat.getChannelDivId = function(message){
    return Aspchat.getChannelDivIdFromName(Aspchat.getChannelName(message));
}

Aspchat.createChannelTab = function(chan_name, user_id){
    tab_id = Aspchat.getChannelTabIdFromName(chan_name);
    tab_object = $(tab_id);
    close_tab_id = tab_id + "_close";
    if (!tab_object) {
        li_template = new Template('<li class="channel current" id="#{tab_id}"><img id="#{close_tab_id}" src="/aspchat/images/cross.png?1"/>#{chan_name}</li>');
        li_content = li_template.evaluate({
            chan_name: chan_name,
            tab_id: tab_id,
            user_id: user_id,
            close_tab_id: close_tab_id
        })
        $('chat-channel-list').insert(li_content);
		Aspchat.channelList.set(tab_id, chan_name);
        
        $(tab_id).observe('click', function(event){
            Aspchat.chatSetActiveChannel(tab_id, chan_name, user_id);
        });
        $(close_tab_id).observe('click', function(event){
            Aspchat.chatRemoveChannel(tab_id, chan_name);
        });
        
        tab_object = $(tab_id);
    }
    return tab_object;
}

Aspchat.createChannelDiv = function(chan_name){
    div_id = Aspchat.getChannelDivIdFromName(chan_name);
    div_object = $(div_id);
    if (!div_object) {
        div_content = '<div class="chat-channel-content" id="' + div_id + '"></div>';
        $('chat-input-area').insert({
            top: div_content
        });
        div_object = $(div_id);
    }
    return div_object;
}

Aspchat.chatCreatePrivate = function(chan_name, user_id){
    tab_object = Aspchat.createChannelTab(chan_name, user_id);
    Aspchat.createChannelDiv(chan_name);
    Aspchat.chatSetActiveChannel(tab_object.id, chan_name, user_id);
}

Aspchat.chatIsPrivateMessage = function(message){
    channel = message['channel'];
    //alert(channel);
    return (!channel || channel == '')
}

Aspchat.getChannelName = function(message){
    return (Aspchat.chatIsPrivateMessage(message)) ? message['nickname'] : message['channel'];
}

Aspchat.resetRemoteUserListPoll = function(){
    Aspchat.stopRemoteUserListPoll();
    Aspchat.user_list_poller_object = new PeriodicalExecuter(Aspchat.updateUserList, Aspchat.polling_list_interval);
}

Aspchat.stopRemoteUserListPoll = function(){
    if (Aspchat.user_list_poller_object) {
        Aspchat.user_list_poller_object.stop();
    }
}

Aspchat.stopRemotePoll = function(){
    Aspchat.chatHideAllChannels();
    Aspchat.stopRemoteUserListPoll();
    
    if (Aspchat.poller_object) {
        Aspchat.poller_object.stop();
    }
}

Aspchat.resetRemotePoll = function(){	
    Aspchat.stopRemotePoll();	
	Aspchat.chatRemotePoll();
    new PeriodicalExecuter(Aspchat.chatRemotePoll, Aspchat.polling_interval);	
}

Aspchat.chatRemotePoll = function(poller){	
	if (Aspchat.online) {		
		new Ajax.Request('/aspchat/messages', {
			parameters: {timestamp:new Date().getTime()}, //we need this to avoid IE caching of the AJAX get
			method: 'get',
			onSuccess: function(transport){
				Aspchat.displayChatMessages(eval(transport.responseText)); //pass the JSON array to displayChatMessages 
				
			}
		});		
		Aspchat.poller_object = poller;
	} else {
		Aspchat.stopRemotePoll();
	}
}

Aspchat.chatResetMessageArea = function(){
    $('chat-input-area-form')['message'].value = "";
    $('chat-input-area-form')['message'].focus();
}

Aspchat.chatPrepareRemoteSubmit = function(){
    $('chat-input-area-form')['to'].value = Aspchat.current_channel;
    $('chat-input-area-form')['resource'].value = Aspchat.resource;
}

Aspchat.chatSetNickname = function(nickname){
    Aspchat.nickname = nickname;
}

Aspchat.updateUserList = function(){
    new Ajax.Updater('chat-user-list', '/aspchat/users', {
        onCreate: function(transport){
            $('chat-user-list-tab-label').addClassName('hidden');
            $$('#chat-user-list-tab .ajax-loader').first().removeClassName('hidden');
        },
        onComplete: function(transport){
            $('chat-user-list-tab-label').removeClassName('hidden');
            $$('#chat-user-list-tab .ajax-loader').first().addClassName('hidden');
        }
    });
}

Aspchat.showUserList = function(){
        if ($('chat-user-list').getStyle('display') == 'block') {
			Aspchat.stopRemoteUserListPoll();
            $('chat-user-list').setStyle({
                display: 'none'
            });
        }
        else {
			if (Aspchat.online) {
				Aspchat.chatMarkAllChannelsInactive();
				Aspchat.updateUserList();
				Aspchat.resetRemoteUserListPoll();
				
				Aspchat.chatHideAllChannels();
				$('chat-user-list').setStyle({
					display: 'block'
				});
			}
        }
    }
	
Aspchat.chatInitializeUserList = function(){
	if (!Aspchat.online) { $('chat-user-list-tab').hide();}
    $('chat-user-list-tab').observe('click', Aspchat.showUserList);
}

Aspchat.toggleStatusTab=function(image_tag) {
	Aspchat.online = !Aspchat.online; //toggle the status
	Aspchat.chatHideAllChannels();  //this hides even the user list window
	Aspchat.removeAllChannels();
	$('chat-user-list-tab').toggle();
	Aspchat.resetRemotePoll(); //so the status change will have effect
	$('chat-status-tab').update(image_tag); //replace with the icon provided by the server
}

Aspchat.chatInitializeStatusTab = function(){
    $('chat-status-tab').observe('click', function(event){		
        new Ajax.Request('/aspchat/toggle_connect', {
			parameters: {online: Aspchat.online},			
			onSuccess: function(transport){				
				Aspchat.toggleStatusTab(transport.responseText);				
			}
		});
    });
}

Aspchat.chatHideAllChannels = function(){
    $$('.chat-channel-content').invoke('hide');
    $('chat-input-area').hide();
	Aspchat.stopRemoteUserListPoll();
}

Aspchat.chatInitializeInputAreaForm = function(){
    message_text = $('chat-input-area-form')['message']
    if (message_text) {
        Element.observe(message_text, 'keypress', function(event){
            var theCode = null;
            if (Event.KEY_RETURN == event.keyCode) {
                $('chat-input-area-form').onsubmit();
                return false;
            }
            else {
                return true;
            }
        });
    }
}

document.observe("dom:loaded", function(){
	if (Aspchat.online) { 
		Aspchat.resetRemotePoll(); 
		}
		
    Aspchat.chatInitializeUserList();
	Aspchat.chatInitializeStatusTab();	
    Aspchat.chatInitializeInputAreaForm();
});
