
$(document).ready(function () {
  var database = firebase.database().ref('//').once('value', function (snapshot) {
    console.log(snapshot.val())

    var talRader = snapshot.child('Rad').val()
    var talSeter = snapshot.child('Seter').val()

    let seats = $('#seats').flexiSeats({
        rows: talRader,
        columns: talSeter,
        multiple: false
    })

    getBlocks()

    /* Funksjon som hentar inn verdiar frå tekstfelta øverst,
      når ein trykker på knappen "Draw"
    */
    $('#btnDraw').click(function () {
        var _rows = parseInt($('#txtRows').val())
        var _cols = parseInt($('#txtCols').val())
    })

    /* Metode som legg til ei ny blokk i nedtrekkslista,
       når ein trykker på knappen "Add" i botnen av sida.
    */
    $('#btnAddBlock').click(function () {
        var _label = $('#txtBlockLabel').val();
        var _price = $('#txtBlockPrice').val();
        var _color = $('#txtBlockColor').val();

        seats.addBlock(_label, _price, _color);
        getBlocks()
    })

    /* Metode som hentar inn eksisterande blokker, og legg desse til i
       nedtrekkslista.
    */
    function getBlocks() {
        $('#lstBlocks').empty();
        $.each(seats.getBlocks(), function (i, v) {
            var _block = $('<option value="' + this.label + '">' + this.label + ' (' + this.price + ' Rs.)</option>');
            $('#lstBlocks').append(_block);
        });
    }

    //Metode som byter mellom Single og Multiple-mode.
    $('.flexiSeatsMode').click(function () {
        seats.setMultiple($(this).val())
    })

    //Metoden som definerar farge på seta som er valgt.
    $('#btnDefineGold').click(function () {
        var _label = $('#lstBlocks').val();
        seats.defineBlock(_label, seats.getSelected())
    })

    //Her blir det satt nokre innstillingar for kvart enkelt sete.
    $('.seat').tooltipster({
        offsetY: -10,
        theme: 'tooltipster-shadow'
    });


  });

mainFunction(jQuery)

});
/*------------------------------------------------------------------------*/

function mainFunction ($) {
    $.fn.flexiSeats = function (options) {
        var scope = this

        //Options
        var settings = $.extend({
            rows: 10,
            columns: 10,
            booked: [],
            notavailable: [],
            multiple: false
        }, options)

        //Local Variables

        var _blocks = [];
        var _seats = [];

        var _available = [];
        var _selected = [];

        var _multiCursor = 0;
        var _multiStart = '';
        var _multiEnd = '';

        //Objects
        block = function () { };
        block.prototype = {
            label: null,
            price: null,
            color: null
        }

        seat = function () { };
        seat.prototype = {
            id: null,
            block: null,
            booked: false,
            available: true,
            notavailable: false,
            selected: false
        }

        //Initialize
        var numSeats = 1
        $('select').on('change', function (e) {
            var optionSelected = $("option:selected", this);
            numSeats = this.value
            console.log("Verdi, select: " + numSeats)
        })


        var _container = this;

        //init();
        //draw(_container);

        //Events
        this.on('click', 'input:checkbox', function () {
            if ($(this).data('status') == 'booked')
                return false;

            var _id = $(this).prop('id').substr(4);

            console.log("Verdi på numSeats er" + numSeats)

            //Viss ein skal bestille eit sete
            if(numSeats == 1){

              console.log("Du provar å booke eit sete")

              if ($(this).prop('checked') == true)
                  selectSeat(_id);
              else {
                  deselectSeat(_id);
              }
            }

            else{
              console.log("Du provar å booke fleire sete")
              selectMultiple(_id, numSeats)
            }

            /*
            if (settings.multiple === true) {
                if (_multiCursor == 0) {
                    _multiCursor = 1;
                    _multiStart = _id;
                    selectSeat(_id);
                }
                else {
                    _multiCursor = 0;
                    _multiEnd = _id;
                    selectMultiple(_multiStart, _multiEnd);
                    _multiStart = '';
                    _multiEnd = '';
                }
            }
            else {
                if ($(this).prop('checked') == true)
                    selectSeat(_id);
                else {
                    deselectSeat(_id);
                }
            }*/
        });

        //Private Functions
        //Initialize
        var dbInitRef = firebase.database().ref('/Plassering').once('value', function (snapshot){

          for(i = 0; i < settings.rows; i++){
            for(j = 0; j < settings.columns; j++){

              //Defining ID
              let _id = i + '-' + j;

              //Creating new seat object and providing ID
              var _seatObject = new seat();
              _seatObject.id = _id;

              if(snapshot.child(_id).child('booked').val() == 'true'){
                console.log('Bookar sete med id ' + _id)
                _seatObject.booked = true
              }


              if(snapshot.child(_id).child('reservert').val() == 'true'){
                console.log('Id lik ' + i + '-' + j + ' er reservert')
                _seatObject.available = false
                _seatObject.notavailable = true
              }

              _seats.push(_seatObject);
            }
          }

          draw(_container)
        })


        function init(){

            for (i = 0; i < settings.rows; i++) {
                for (j = 0; j < settings.columns; j++) {

                    //Defining ID
                    var _id = i + '-' + j;

                    //Creating new seat object and providing ID
                    var _seatObject = new seat();
                    _seatObject.id = _id;

                    //Check if seat is already in booked status
                    if ($.inArray(_id, settings.booked) >= 0) {
                        _seatObject.booked = true;
                    }

                    //Check if seat is available for booking
                    else if ($.inArray(_id, settings.notavailable) >= 0) {
                        _seatObject.available = false
                        _seatObject.notavailable = true
                    }

                    //Other conditions
                    else {
                    }
                    _seats.push(_seatObject);
                }
            }

        }

        //Draw layout - metoden som faktisk teiknar opp alt!
        function draw(container) {
            //Clearing the current layout
            container.empty();

            //Providing Column labels
            var _rowLabel = $('<div class="row"><span class="row-label"></span></div>');
            for (c = 0; c < settings.columns; c++) {
                _rowLabel.append('<span class="col-label">' + c + '</span>');
            }

            container.append(_rowLabel);

            //Creating Initial Layout
            for (i = 0; i < settings.rows; i++) {

                //Providing Row label
                var _row = $('<div class="row"></div>');
                var _colLabel = $('<span class="row-label">' + String.fromCharCode(65+i) + '</span>');
                _row.append(_colLabel);

                for (j = 0; j < settings.columns; j++) {
                    var _id = i + '-' + j;

                    //Finding the seat from the array
                    var _seatObject = _seats.filter(function(seat){
                        return seat.id == _id;
                    })[0];

                    var _seatClass = 'seat';
                    var _seatBlockColor = '#fff';
                    var _price = 0;

                    if (_seatObject.block != null) {
                        _seatBlockColor = _blocks.filter(function (block) { return block.label == _seatObject.block })[0].color;
                        var _block = _blocks.filter(function (block) {
                            return block.label == _seatObject.block;
                        });
                        _price = _block[0].price;
                    }

                    var _checkbox = $('<input id="seat' + _seatObject.id + '" data-block="' + _seatObject.block + '" type="checkbox" />');
                    var _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '" style="background-color: ' + _seatBlockColor + '"  title="#' + String.fromCharCode(65 + i) + '-' + j + ', ' + _price + ' Rs."></label>');

                    //Må her sjekke i databasen for updates når ein teiknar på nytt.

                    if (_seatObject.booked) {
                        _checkbox.prop('disabled', 'disabled');
                        _checkbox.attr('data-status', 'booked');
                    }

                    else if (_seatObject.notavailable) {
                        _checkbox.prop('disabled', 'disabled');
                        _checkbox.attr('data-status', 'notavailable');
                    }
                    else {
                        console.log("Ingen attr satt for sete " + _id)
                    }

                    _row.append(_checkbox);
                    _row.append(_seat);
                }
                container.append(_row);
            }
        }

        //Select a single seat
        function selectSeat(id) {
            if ($.inArray(id, _selected) == -1) {
                _selected.push(id);
                var _seatObj = _seats.filter(function (seat) {
                    return seat.id == id;
                });
                console.log("Enkeltsetet sin id: " + id)
                _seatObj[0].selected = true;

                //TODO: Snakke med databasen og vise gitt sete som "valgt"
                //TODO: Gjere setet utilgjengeleg for andre brukarar.

                console.log('SeteID: ' + _seatObj[0].id)
                var dbRef = firebase.database().ref('/Plassering/' + _seatObj[0].id)
                    .update({ id: _seatObj[0].id,
                              reservert: 'true',
                              booked: 'false'
                              });
            }
        }

        //Deselect a single seat
        function deselectSeat(id) {
            _selected = $.grep(_selected, function (item) {
                return item !== id;
            });
            var _seatObj = _seats.filter(function (seat) {
                return seat.id == id;
            });

            _seatObj[0].selected = false;

            var dbRef = firebase.database().ref('/Plassering/' + _seatObj[0].id)
                .update({ id: _seatObj[0].id,
                          reservert: 'false',
                          booked: 'false'
                          });

        }

        //Select multiple seats
        function selectMultiple(start, numSeats) {
            var _i = start.split('-');
            //var _j = end.split('-');
            var endX = parseInt(_i[1]) + (numSeats - 1)
            var _slutt = _i[1] + '-' + endX

            console.log("Skal lese fra sete: " + _i[1] + " til sete " + endX + " paa rad " + _i[0])
            for(x = parseInt(_i[1]) ; x <= parseInt(endX) ; x++){

              if ($('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).data('status') != 'notavailable' && $('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).data('status') != 'booked') {
                  $('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).prop('checked', 'checked');
                  selectSeat(_i[0] + '-' + x);
                  console.log("Valgte sete" + _i[0] + '-' + x)
              }
            }
        }

        $('#nullstill').click(function () {

          $.each(_seats, function (i, v) {
              var _this = this
              var _seat = _seats.filter(function (seat) {
                  return seat.id == _this.id;
              });

              _seat[0].booked = false;
              _seat[0].selected = false;
              _seat[0].available = true;


              var dbRef = firebase.database().ref('/Plassering/' + _seat[0].id)
                  .update({ id: _seat[0].id,
                            reservert: 'false',
                            booked: 'false',
                            notavailable: 'false',
                            available: 'true'
                            });

            })

            draw(_container)
        })

        //API
        return {
            draw: function () {
                draw(_container);
            },
            getAvailable: function () {
                return _seats.filter(function (seat) {
                    return seat.available == true;
                });
            },
            getNotAvailable: function () {
                return _seats.filter(function (seat) {
                    return seat.notavailable == true;
                });
            },
            getBooked: function () {
                return _seats.filter(function (seat) {
                    return seat.booked == true;
                });
            },
            getSelected: function () {
                return _seats.filter(function (seat) {
                    return seat.selected == true;

                });
            },
            setMultiple: function (value) {
                _multiCursor = 0;
                settings.multiple = value === 'true';
            },

            getBlocks: function(){
                return _blocks;
            },
            addBlock: function (label, price, color) {
                var _newBlock = new block();
                _newBlock.label = label;
                _newBlock.price = price;
                _newBlock.color = color;
                _blocks.push(_newBlock);
            },
            removeBlock: function (label) {
                _blocks = $.grep(_blocks, function (item) {
                    return item.label !== label;
                });
            },

            //Metoden som oppdaterar med ny farge når vi set ei blokk. (?)
            defineBlock: function (label, seats) {
                $.each(seats, function (i, v) {
                    var _this = this;
                    var _seat = _seats.filter(function (seat) {
                        return seat.id == _this.id;
                    });
                    _seat[0].block = label;
                    _seat[0].selected = false;
                    _seat[0].booked = true;
                    _seat[0].available = false;

                    var dbRef = firebase.database().ref('/Plassering/' + _seat[0].id)
                        .update({ id: _seat[0].id,
                                  reservert: 'false',
                                  booked: 'true'
                                  });

                });
                draw(_container);
            }



        }
    };
};
