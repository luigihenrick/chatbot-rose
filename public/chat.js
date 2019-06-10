(function () {
    var Message;
    var Report;
    var roseIsTyping;
    var roseTyping;
    var chatbotData = {
        text: '',
        isPassword: false,
        context: {},
        conversation: {}
    };
    var graphColors = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
    };
    
    Message = function (arg) {
        this.text = arg.text,
        this.message_side = arg.message_side,
        this.report_type = arg.report_type;
        this.report_data = arg.report_data;

        this.draw = function (_this) {
            return function () {
                var $messages, $message, $report;

                if (_this.text && _this.text.trim() === '') {
                    return;
                }

                if (_this.message_side === 'right') {
                    $('.message_input').val('');
                }
    
                var hideText = $('.message_input')[0].type === "password" && _this.message_side === 'right';
                _this.text = hideText ? _this.text.replace(/./g, '*') : _this.text;

                $message = $($('.message_template').clone().html());
                if (!_this.report_type) {
                    $message.addClass(_this.message_side).find('.text').html(_this.text);
                } else {
                    $report = $($('.report_template').clone().html());
                    new Report({
                        ctx: $report[0].getContext('2d'), 
                        type: _this.report_type,
                        data: _this.report_data
                    }).draw();
                    $message.addClass(_this.message_side).find('.text_wrapper').html($report);
                }
                
                $messages = $('.messages');                
                $('.messages').append($message);
                return setTimeout(function () {
                    $message.addClass('appeared');
                    if ($report) { $report.css("display", ""); }
                    return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
                }, 0);
            };
        }(this);
        return this;
    };

    Report = function(arg) {
        this.data = arg.data;
        this.type = arg.type;
        this.ctx = arg.ctx;

        this.draw = function(_this) {
            return function() {
                return setTimeout(function () {
                    new Chart(_this.ctx, {
                        type: _this.type,
                        data: _this.data,
                        options: {
                            responsive: true
                        }
                    });
                }, 0);
            }
        }(this);
        return this;
    }

    $(function () {
        var getMessageText, 
        sendMessage, 
        sendMessageRequest;
        
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

        roseTyping = function(isTyping) {
            roseIsTyping = isTyping;
            if (isTyping) {
                $('div.send_message').css("display", "none");
                $('div.typing_indicator').css("display", "");
            }
            else {
                $('div.send_message').css("display", "");
                $('div.typing_indicator').css("display", "none");
            }
        };
        
        sendMessageRequest = function (chatbotData) {
            $.ajax({
                url: '/conversation/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(chatbotData),
                error: function (xhr, error) {
                    if (xhr.status === 403) {
                        new Message({ text: 'Falha ao validar sua senha, tente novamente mais tarde.', message_side: 'left' }).draw();
                    } else if (xhr.status === 401) {
                        new Message({ text: 'Não foi possível localizar este telefone, verifique se digitou corretamente.', message_side: 'left' }).draw();
                    } else {
                        new Message({ text: 'Ops, nem sempre as coisas funcionam como esperado, ocorreu algum erro ao enviar sua mensagem, por favor, tente novamente.', message_side: 'left' }).draw();
                    }
                    console.debug(xhr); console.debug(error);
                },
                success: function (data) {
                    chatbotData.isPassword = data.isPassword;

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

                    roseTyping(true);
                    
                    if (data.reportType) {
                        new Message({ 
                            message_side:'left',
                            report_type: data.reportType,
                            report_data: data.reportData
                        }).draw(); 
                        roseTyping(false); 
                        return;
                    } 
                    
                    var timeToNext = 0;
                    data.text.forEach((t, idx, arr) => {
                        timeToNext += (1000 + t.length * 20);
                        setTimeout(() => { 
                            new Message({ 
                                text:t, 
                                message_side:'left'
                            }).draw(); 
                            roseTyping((idx === arr.length - 1) ? false : true); 
                        }, timeToNext);
                    });
                }
            });
        };

        sendMessage = function() {
            chatbotData.text = getMessageText();
            if (chatbotData.text !== null && chatbotData.text !== undefined) {
                new Message({ text: chatbotData.text, message_side: 'right' }).draw();
                sendMessageRequest(chatbotData);
            }
        };

        $('.send_message').click(function (e) {
            if (!roseIsTyping) {
                sendMessage();
                return;
            }
        });

        $('.message_input').keyup(function (e) {
            if (e.which === 13 && !roseIsTyping) {
                sendMessage();
                return;
            }
        });
        // return;

        var localData = window.localStorage.getItem('chatbot_conversation');
        var lastConversation = !!localData ? JSON.parse(localData) : '';
        if (!!lastConversation.user_id) {
            chatbotData.text = '{{LOGGED_USER}}';
            chatbotData.conversation = lastConversation;
            sendMessageRequest(chatbotData);
        } else {
            chatbotData.text = '{{NEW_TALK}}'
            sendMessageRequest(chatbotData);
        }
    });
}.call(this));