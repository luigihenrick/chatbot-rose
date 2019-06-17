(function () {
    var Message;
    var Report;
    var roseIsTyping;
    var roseTyping;
    var resizeFunc;
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

    resizeFunc = function() {
        var height = document.querySelector('.chat_window').offsetHeight - document.querySelector('.top_menu').offsetHeight - document.querySelector('.bottom_wrapper').offsetHeight; 
        document.querySelector('.messages').setAttribute('style','height:'+height+'px');
    };

    $(window).resize(resizeFunc).resize();

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
    
                var hideText = $('.message_input')[0].type === 'password' && _this.message_side === 'right';
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
                    if ($report) { $report.css('display', ''); }
                    resizeFunc();
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
                            responsive: true,
                            scales: {yAxes: [{ticks: { beginAtZero :true}}]}
                        }
                    });
                }, 0);
            }
        }(this);
        return this;
    }

    $(function () {
        var getMessageText, 
        addResponseOptions,
        sendMessage, 
        sendMessageRequest;
        
        getMessageText = function (e) {
            let $message_input, $option;
            $message_input = $('.message_input').val();
            $option = $(e).find('.value').html();

            if ($option) {
                $message_input = $option;
            }

            if ($message_input.trim() === '') {
                $('.message_input_wrapper').removeClass('error');
                setTimeout(() => { $('.message_input_wrapper').addClass('error'); }, 100);
                $('div.message_input_wrapper > input').attr('placeholder', 'Digite uma mensagem para continuar.');
                return;
            }

            $('.message_input_wrapper').removeClass('error');
            $('div.message_input_wrapper > input').attr('placeholder', 'Digite a mensagem aqui...');
            return $message_input;
        };

        roseTyping = function(isTyping) {
            roseIsTyping = isTyping;
            let $options = $('.bottom_wrapper').find('.option');

            if (isTyping) {
                $('div.send_message').css('display', 'none');
                $('div.message_input_wrapper').css('display', 'none');
                $('div.typing_indicator').css('display', '');
            }
            else {
                if($options.length === 0){
                    $('div.send_message').css('display', '');
                    $('div.message_input_wrapper').css('display', '');
                } else {
                    $options.css('display', '');
                }

                $('div.typing_indicator').css('display', 'none');
            }
        };
        
        addResponseOptions = function(data) {
            var $options;
            chatbotData.isPassword = data.isPassword;

            if (data.isPassword) {
                $('div.message_input_wrapper > input').attr('type', 'password');
            } else {
                $('div.message_input_wrapper > input').attr('type', '');
            }

            if (data.options) {
                // $('div.message_input_wrapper').css('display', 'none');
                $('div.send_message').css('display', 'none');
                
                data.options.forEach((item) => {
                    $options = $($('.options_template').clone().html());
                    $options.find('.text').html(item.label);
                    $options.find('.value').html(item.value.input.text);

                    $('.bottom_wrapper').prepend($options);
                });
            } else {
                // $('div.message_input_wrapper').css('display', '');
                $('.bottom_wrapper').find('.option').css('display', 'none');
            }
        }

        sendMessageRequest = function (chatbotData) {
            roseTyping(true);
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
                    roseTyping(false);
                },
                success: function (data) {
                    addResponseOptions(data);
                    
                    if (data.conversation !== null && data.conversation !== undefined) {
                        window.localStorage.setItem('chatbot_conversation', JSON.stringify(data.conversation));
                        chatbotData.conversation = data.conversation;
                    }
                    
                    if (data.context !== null && data.context !== undefined) {
                        chatbotData.context = data.context;
                    }
                    
                    var timeToNext = 0;
                    data.text.forEach((t, idx, arr) => {
                        timeToNext += (1000 + t.length * 20);
                        setTimeout(() => {                             
                            // print report before last message
                            if (idx === arr.length - 2 && data.reportType) {
                                new Message({ message_side:'left', report_type: data.reportType, report_data: data.reportData }).draw();
                            }

                            // set typing false after last message
                            if (idx === arr.length - 1) {
                                roseTyping(false);
                            }

                            // print message with pause
                            new Message({ text:t, message_side:'left' }).draw();
                        }, timeToNext);
                    });
                }
            });
        };

        sendMessage = function(e) {
            $option = $(e).find('.text').html();
            chatbotData.text = getMessageText(e);
            if (chatbotData.text !== null && chatbotData.text !== undefined) {
                new Message({ text: $option ? $option : chatbotData.text, message_side: 'right' }).draw();
                sendMessageRequest(chatbotData);
            }
        };

        $('.send_message').click(function (e) {
            if (!roseIsTyping) {
                sendMessage();
                return;
            }
        });

        $('.bottom_wrapper').on('click', '.option', function (e) {
            if (!roseIsTyping) {
                sendMessage($(this));
                $('.bottom_wrapper').find('.option').remove();
                return;
            }
        });

        $('.message_input').keyup(function (e) {
            if (e.which === 13 && !roseIsTyping) {
                sendMessage();
                return;
            }
        });

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