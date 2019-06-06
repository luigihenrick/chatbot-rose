(function () {
    var Message;
    var chatbotData = {
        text: '',
        isPassword: false,
        context: {},
        conversation: {}
    };
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };
    $(function () {
        var getMessageText, message_side, sendMessage;
        message_side = 'right';
        getMessageText = function () {
            var $message_input;
            $message_input = $('.message_input').val();

            if ($message_input.trim() === "") {
                $('.message_input_wrapper').removeClass('error');
                setTimeout(() => { $('.message_input_wrapper').addClass('error'); }, 100);
                $('div.message_input_wrapper > input').attr("placeholder", "Digite uma mensagem para continuar.");
                return;
            }

            $('.message_input_wrapper').removeClass('error');
            $('div.message_input_wrapper > input').attr("placeholder", "Digite a mensagem aqui...");
            return $message_input;
        };
        sendMessage = function (text, message_side) {
            var $messages, message;
            if (text.trim() === '') {
                return;
            }
            if (message_side === 'right') {
                $('.message_input').val('');
            }
            $messages = $('.messages');
            // message_side = message_side === 'left' ? 'right' : 'left';

            var hideText = $('.message_input')[0].type === "password" && message_side === 'right';
            message = new Message({
                text: hideText ? text.replace(/./g, '*') : text,
                message_side: message_side
            });
            message.draw();
            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };
        sendMessageToAssistant = function (chatbotData) {
            $.ajax({
                url: '/conversation/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(chatbotData),
                error: function (xhr, error) {
                    if (xhr.status === 401) {
                        sendMessage('Falha ao validar sua senha, tente novamente mais tarde.', 'left');
                    } else {
                        sendMessage('Ops, nem sempre as coisas funcionam como esperado, ocorreu algum erro ao enviar sua mensagem, por favor, tente novamente.', 'left');
                    }
                    console.debug(xhr); console.debug(error);
                },
                success: function (data) {
                    
                    if (data.conversation !== null && data.conversation !== undefined) {
                        window.localStorage.setItem('chatbot_conversation', JSON.stringify(data.conversation));
                        chatbotData.conversation = data.conversation;
                    }
                    
                    if (data.context !== null && data.context !== undefined) {
                        chatbotData.context = data.context;
                    }
                    
                    if (data.isPassword) {
                        $('div.message_input_wrapper > input').attr("type", "password");
                    } else {
                        $('div.message_input_wrapper > input').attr("type", "");
                    }

                    chatbotData.isPassword = data.isPassword;

                    var timeToNext = 0;
                    data.text.forEach(t => {
                        timeToNext += (1000 + t.length * 20);
                        setTimeout(() => { sendMessage(t, 'left'); }, timeToNext)
                    });
                }
            });
        };

        $('.send_message').click(function (e) {
            chatbotData.text = getMessageText();
            if (chatbotData.text !== null && chatbotData.text !== undefined) {
                sendMessage(chatbotData.text, 'right');
                sendMessageToAssistant(chatbotData);
            }
            return;
        });

        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                chatbotData.text = getMessageText();
                if (chatbotData.text !== null && chatbotData.text !== undefined) {
                    sendMessage(chatbotData.text, 'right');
                    sendMessageToAssistant(chatbotData);
                }
                return;
            }
        });

        var localData = window.localStorage.getItem('chatbot_conversation');
        var lastConversation = !!localData ? JSON.parse(localData) : '';
        if (!!lastConversation.user_id) {
            chatbotData.text = '{{LOGGED_USER}}';
            chatbotData.conversation = lastConversation;
            sendMessageToAssistant(chatbotData);
        } else {
            chatbotData.text = '{{NEW_TALK}}'
            sendMessageToAssistant(chatbotData);
        }
    });
}.call(this));