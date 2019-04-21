(function () {
    var Message;
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
            $message_input = $('.message_input');
            return $message_input.val();
        };
        sendMessage = function (text, message_side) {
            var $messages, message;
            if (text.trim() === '') {
                return;
            }
            $('.message_input').val('');
            $messages = $('.messages');
            // message_side = message_side === 'left' ? 'right' : 'left';
            message = new Message({
                text: text,
                message_side: message_side
            });
            message.draw();
            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };

        sendMessageToAssistant = function (text) {
            $.ajax({
                url: '/conversation/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ text: text }),

                success: function (data) {
                    var i = 0;
                    data.forEach(e => setTimeout(() => {
                        sendMessage(e, 'left');
                    }, 1500 * i++));
                }
            });
        };

        $('.send_message').click(function (e) {
            var text = getMessageText();

            sendMessage(text, 'right');
            sendMessageToAssistant(text);

            return;
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                var text = getMessageText();

                sendMessage(text, 'right');
                sendMessageToAssistant(text);

                return;
            }
        });

        var phonenumber = window.localStorage.getItem('user_phone_number')
        if (!!phonenumber) {
            sendMessageToAssistant(phonenumber);
        } else {
            sendMessageToAssistant('Começar de novo');
        }
    });
}.call(this));