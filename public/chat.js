(function () {
    var Message;
    var Entities;
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
                    data.text.forEach(e => setTimeout(() => {
                        sendMessage(e, 'left');
                    }, 1500 * i++));
                    if (!!data.entities) {
                        window.localStorage.setItem('user_data', JSON.stringify(data.entities))
                    }
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

        var userdata = window.localStorage.getItem('user_data');
        sendMessageToAssistant('Recomeçar');
        if (!!userdata) {
            Entities = JSON.parse(userdata);
            sendMessageToAssistant('{{LOGGED_USER}}');
            sendMessageToAssistant(Entities.name);
            sendMessageToAssistant(Entities.phonenumber);
            sendMessageToAssistant(Entities.routine);
        } else {
            sendMessageToAssistant('Sim');
        }
    });
}.call(this));