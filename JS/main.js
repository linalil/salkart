$(document).ready(function () {
  /* Opnar kopling til databasen og hentar inn tal rader og seter.
    Lagrar denne informasjonen i eit seteobjekt. */
  firebase.database().ref('//').once('value', function (snapshot) {
    var talRader = snapshot.child('Rad').val()
    var talSeter = snapshot.child('Seter').val()

    console.log('Rader: ' + talRader + ', Seter: ' + talSeter)

    let seats = $('#seats').flexiSeats({
      rows: talRader,
      columns: talSeter,
      multiple: false
    })

    getBlocks()

    /* Metode som legg til ei ny blokk i nedtrekkslista,
       når ein trykker på knappen "Add" i botnen av sida. */
    $('#btnAddBlock').click(function () {
      var _label = $('#txtBlockLabel').val()
      var _price = $('#txtBlockPrice').val()
      var _color = $('#txtBlockColor').val()

      seats.addBlock(_label, _price, _color)
      getBlocks()
    })

    /* Metode som hentar inn eksisterande blokker, og legg desse til i
       nedtrekkslista. */
    function getBlocks () {
      $('#lstBlocks').empty()
      $.each(seats.getBlocks(), function (i, v) {
        var _block = $('<option value="' + this.label + '">' + this.label + ' (' + this.price + ' Rs.)</option>')
        $('#lstBlocks').append(_block)
      })
    }

    // Metode som byter mellom Single og Multiple-mode.
    $('.flexiSeatsMode').click(function () {
      seats.setMultiple($(this).val())
    })

    // Metoden som definerar farge på seta som er valgt.
    $('#btnDefineGold').click(function () {
      var _label = $('#lstBlocks').val()
      seats.defineBlock(_label, seats.getSelected())
    })

    // Her blir det satt nokre innstillingar for kvart enkelt sete.
    $('.seat').tooltipster({
      offsetY: -10,
      theme: 'tooltipster-shadow'
    })
  })

    // Køyrer hovudfunksjonen under.
  mainFunction(jQuery)
})
/* ------------------------------------------------------------------------ */

function mainFunction ($) {
  $.fn.flexiSeats = function (options) {
    var scope = this

    // Options
    var settings = $.extend({
      rows: 10,
      columns: 10,
      booked: [],
      notavailable: [],
      multiple: false
    }, options)

    // Local Variables
    // Variabel som lagrar kva sete du har trykt på.
    let mySeats = []
    var _blocks = []
    var _seats = []
    // var _available = []
    var _selected = []

    // Objects
    let block = function () {}
    block.prototype = {
      label: null,
      price: null,
      color: null
    }

    // Definisjonen av eit sete-objekt.
    let seat = function () {}
    seat.prototype = {
      id: null,
      block: null,
      booked: false,
      available: true,
      notavailable: false,
      selected: false
    }

    // Sjekkar kor mange sete brukar ønskjer å velje, endrar seg i forhold til nedtrekkslista.
    let numSeats = 1
    $('select').on('change', function (e) {
      // var optionSelected = $('option:selected', this)
      numSeats = this.value
      console.log('Verdi, select:' + numSeats)
      clearMySeats()
    })
    var _container = this

    // Events
    this.on('click', 'input:checkbox', function () {
      if ($(this).data('status') === 'booked') {
        return false
      }
      var _id = $(this).prop('id').substr(4)

      // Viss ein skal bestille eit sete
      if (parseInt(numSeats) === 1) {
        if ($(this).prop('checked') === true) {
          selectSeat(_id)
        } else {
          deselectSeat(_id)
        }
      } else {
        if ($(this).prop('checked') === true) {
          selectMultiple(_id, numSeats)
        } else {
          clearMySeats()
        }
      }
    })

  // Private Functions
    // Opnar databasetilkopling til 'Plassering'-greina.
    var dbInitRef = firebase.database().ref('/Plassering')

    // Første gong når ein teknar opp salkartet.
    dbInitRef.once('value', function (snapshot) {
      console.log('Initialisering av salkart... ')

      // Går gjennom seter og rader som satt i settings.
      for (var i = 0; i < settings.rows; i++) {
        for (var j = 0; j < settings.columns; j++) {
          // Defining ID
          let _id = i + '-' + j

          // Creating new seat object and providing ID
          var _seatObject = new seat()
          _seatObject.id = _id

          // Sjekkar om setet med gitt id har status booka i databasen.
          if (snapshot.child(_id).child('booked').val() === true) {
            console.log('Bookar sete med id ' + _id)
            // Set i så fall booked til true, slik at setet blir teikna opp grønt.
            _seatObject.booked = true
          }

          // Sjekkar om setet med gitt id har status reservert i databasen.
          if (snapshot.child(_id).child('reservert').val() === true) {
            console.log('Id lik ' + i + '-' + j + ' er reservert')
            // Passar i så fall på at det ikkje skal vere tilgjengeleg.
            _seatObject.available = false
            _seatObject.notavailable = true
          }

          _seats.push(_seatObject)
        }
      }

      // Teiknar opp salkartet
      draw(_container)
    })

    // Dersom eit av borna under 'Plassering' endrar seg, så vil callbackmetoden under køyrast.
    dbInitRef.on('child_changed', function (snapshot) {
      // c er bornet der det har skjedd ei endring, altså det setet som har endra status.
      var c = snapshot.val()
      console.log(c.id + ' was changed, reservert:' + c.reservert + ', og booked:' + c.booked)

      // Hentar ut dette setet frå lista over alle ved hjelp av id-en.
      var _seatObj = _seats.filter(function (seat) {
        return seat.id === c.id
      })

      // Sjekkar at setet ikkje er eit av "dine sete" lagra i mySeats
      if (($.inArray(c.id, mySeats)) === -1) {
        // Dersom det er reservert (og ikkje ditt), sett status 'utilgjengeleg'
        // Setet vil då bli farga mørkegrått.
        if (c.reservert === true) {
          _seatObj[0].available = false
          _seatObj[0].notavailable = true
        } else if (c.booked === true) {
          _seatObj[0].booked = true
          _seatObj[0].available = false
        } else if (c.reservert === false && c.booked === false) {
          _seatObj[0].available = true
          _seatObj[0].notavailable = false
        }
      } else {
        _seatObj[0].reservert = true
      }

      // Teikn salkartet på nytt.
      draw(_container)
    })

    // Draw layout - metoden som teiknar opp salkart
    function draw (container) {
      // Clearing the current layout
      container.empty()

      // Providing Column labels
      var _rowLabel = $('<div class="row"><span class="row-label"></span></div>')
      for (var c = 0; c < settings.columns; c++) {
        _rowLabel.append('<span class="col-label">' + c + '</span>')
      }

      container.append(_rowLabel)

      // Creating Initial Layout
      for (var i = 0; i < settings.rows; i++) {
        // Providing Row label
        var _row = $('<div class="row"></div>')
        var _colLabel = $('<span class="row-label">' + i + '</span>')
        _row.append(_colLabel)

        for (var j = 0; j < settings.columns; j++) {
          var _id = i + '-' + j

          // Finding the seat from the array
          var _seatObject = _seats.filter(function (seat) {
            return seat.id === _id
          })[0]

          var _seatClass = 'seat'
          var _seatBlockColor = '#fff'
          var _price = 0

          if (_seatObject.block != null) {
            _seatBlockColor = _blocks.filter(function (block) {
              return block.label === _seatObject.block
            })[0].color

            var _block = _blocks.filter(function (block) {
              return block.label === _seatObject.block
            })

            _price = _block[0].price
          }

          var _checkbox = $('<input id="seat' + _seatObject.id + '" data-block="' + _seatObject.block + '" type="checkbox" />')
          var _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '"  title="#' + String.fromCharCode(65 + i) + '-' + j + ', ' + _price + ' Rs."></label>')

          if (_seatObject.booked) {
            _checkbox.prop('disabled', 'disabled')
            _checkbox.attr('data-status', 'booked')
          } else if (_seatObject.selected) {
            _checkbox.prop('checked', 'checked')
            // _checkbox.attr('data-status', 'reserved')
          } else if (_seatObject.notavailable) {
            _checkbox.prop('disabled', 'disabled')
            _checkbox.attr('data-status', 'notavailable')
          } else {}

          _row.append(_checkbox)
          _row.append(_seat)
        }
        container.append(_row)
      }
    }

    // Select a single seat
    function selectSeat (id) {
      if ($.inArray(id, _selected) === -1) {
        if (numSeats === 1) {
          clearMySeats()
        }

        _selected.push(id)
        var _seatObj = _seats.filter(function (seat) {
          return seat.id === id
        })

        // Oppdaterar status til reservert.
        _seatObj[0].selected = true
        _seatObj[0].notavailable = true

        // Lagrar setet i lista over mine sete, mySeats
        mySeats.push(id)

        // Oppdaterar databasen.
        let dbRef = firebase.database().ref('/Plassering/' + _seatObj[0].id)
        dbRef.transaction(function (sete) {
          if (sete) {
            sete.id = _seatObj[0].id
            sete.reservert = true
            sete.booked = false
          } else {
            console.log('Feilmelding for transaksjon')
          }
          return sete
        })
      }
    }

    // Deselect a single seat
    function deselectSeat (id) {
      _selected = $.grep(_selected, function (item) {
        return item !== id
      })

      var _seatObj = _seats.filter(function (seat) {
        return seat.id === id
      })

      // Endrar status til at setet ikkje er reservert.
      _seatObj[0].selected = false
      _seatObj[0].notavailable = false

      // Oppdaterar databasen.
      var dbRef = firebase.database().ref('/Plassering/' + _seatObj[0].id)
      dbRef.transaction(function (sete) {
        if (sete) {
          sete.id = _seatObj[0].id
          sete.reservert = false
          sete.booked = false
        } else {
          console.log('Feilmelding for transaksjon')
        }
        return sete
      })
    }

    // Metode som slettar lokalt lagra sete
    function clearMySeats () {
      console.log('Slettar lagra sete..')

      for (let i = 0; i < mySeats.length; i++) {
        let tempId = mySeats[i]
        console.log('Koyrer deselect for id: ' + tempId)
        deselectSeat(tempId)
      }
      mySeats.length = 0
    }

    // Select multiple seats
    function selectMultiple (start, numSeats) {
      var _i = start.split('-')

      // Finn endepunktet som ein skal gå til, basert på kor mange sete ein ønskjer.
      var endX = parseInt(_i[1]) + (numSeats - 1)

      if (mySeats.length >= numSeats) {
        clearMySeats()
      }

      // console.log('No skal vi sjekke for gaps:')
      checkNoGaps(start)

      console.log('Skal no lese fra sete: ' + _i[1] + ' til sete ' + endX + ' paa rad ' + _i[0])
      if (parseInt(endX) < settings.columns) {
        console.log('No teiknar vi! ')
        for (let x = parseInt(_i[1]); x <= parseInt(endX); x++) {
          if ($('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).data('status') !== 'notavailable' && $('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).data('status') !== 'booked') {
            $('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).prop('checked', 'checked')
            selectSeat(_i[0] + '-' + x)
          }
        }
      } else {
        console.log('Feilmelding: sete ' + endX + ' er utanfor salen.')
        // clearMySeats()
      }
    }

    function checkNoGaps (startId) {
      checkSeatGapsLeft(startId)
      checkSeatGapsRight(startId)
    }

    // Metode som sjekkar for gaps på venstre side.
    function checkSeatGapsLeft (startId) {
      let _i = startId.split('-')
      let doubleLeft = parseInt(_i[1]) - 2
      let left = parseInt(_i[1]) - 1
      // Sjekkar om setet to hakk til venstre i salen er meir enn eit hakk frå kanten.
      if (doubleLeft >= 0) {
        console.log('To hakk til venstre for ' + _i[1] + ' er ' + doubleLeft)
        console.log('Booka: ' + checkBooked(_i[0] + '-' + doubleLeft))
        console.log('Reservert: ' + checkReserved(_i[0] + '-' + doubleLeft))
        console.log('Eit hakk til venstre for ' + _i[1] + ' er ' + left)
        console.log('Booka: ' + checkBooked(_i[0] + '-' + left))
        console.log('Reservert: ' + checkReserved(_i[0] + '-' + left))
      } else {
        console.log('Setet er 1 eller 0 hakk fra kanten til venstre.')
      }
    }

    // Metode som sjekkar om gitt sete er booka.
    function checkBooked (id) {
      let booked = _seats.filter(function (seat) {
        return seat.booked === true
      })
      let i = 0
      while (booked[i] != null) {
        if (booked[i].id === id) {
          return true
        }
        i++
      }
      return false
    }

    // Metode som sjekkar om gitte sete er reservert.
    function checkReserved (id) {
      let reserved = _seats.filter(function (seat) {
        return seat.notavailable === true
      })
      let i = 0
      while (reserved[i] != null) {
        if (reserved[i].id === id) {
          return true
        }
        i++
      }
      return false
    }

    // Metode som sjekkar for gaps på høgre side.
    function checkSeatGapsRight (startId) {
      let _i = startId.split('-')
      let endSeat = parseInt(_i[1]) + parseInt(numSeats - 1)
      let doubleRight = parseInt(endSeat + 2)
      let right = parseInt(endSeat + 1)

      if (doubleRight <= (settings.columns - 1)) {
        console.log('To hakk til hogre for ' + endSeat + ' er ' + doubleRight)
        console.log('Booka: ' + checkBooked(_i[0] + '-' + doubleRight))
        console.log('Reservert: ' + checkReserved(_i[0] + '-' + doubleRight))
        console.log('Eit hakk til hogre for ' + endSeat + ' er ' + right)
        console.log('Booka: ' + checkBooked(_i[0] + '-' + right))
        console.log('Reservert: ' + checkReserved(_i[0] + '-' + right))
      } else {
        console.log('Setet er 0 eller 1 hakk fra kanten til hogre.')
      }
    }

    // Metode som nullstiller kart og database når ein trykker på nullstill.
    $('#nullstill').click(function () {
      $.each(_seats, function (i, v) {
        var _this = this
        var _seat = _seats.filter(function (seat) {
          return seat.id === _this.id
        })

        _seat[0].booked = false
        _seat[0].selected = false
        _seat[0].available = true
        _seat[0].notavailable = false

        var dbRef = firebase.database().ref('/Plassering/' + _seat[0].id)
        dbRef.transaction(function (sete) {
          if (sete) {
            sete.id = _seat[0].id
            sete.reservert = false
            sete.booked = false
          } else {
            console.log('Feilmelding for transaksjon')
          }
          return sete
        })
      })
      draw(_container)
    })

    // API
    return {
      draw: function () {
        draw(_container)
      },
      getAvailable: function () {
        return _seats.filter(function (seat) {
          return seat.available === true
        })
      },
      getNotAvailable: function () {
        return _seats.filter(function (seat) {
          return seat.notavailable === true
        })
      },
      getBooked: function () {
        return _seats.filter(function (seat) {
          return seat.booked === true
        })
      },
      getSelected: function () {
        return _seats.filter(function (seat) {
          return seat.selected === true
        })
      },
      setMultiple: function (value) {
        settings.multiple = value === 'true'
      },
      getBlocks: function () {
        return _blocks
      },
      addBlock: function (label, price, color) {
        var _newBlock = new block()
        _newBlock.label = label
        _newBlock.price = price
        _newBlock.color = color
        _blocks.push(_newBlock)
      },
      removeBlock: function (label) {
        _blocks = $.grep(_blocks, function (item) {
          return item.label !== label
        })
      },

      // Metoden som "kjøper billettar" når vi trykker på knappen.
      defineBlock: function (label, seats) {
        // For kvart av seta som er selected...
        $.each(seats, function (i, v) {
          var _this = this
          var _seat = _seats.filter(function (seat) {
            return seat.id === _this.id
          })

          // ..endre status på setet,
          _seat[0].block = label
          _seat[0].selected = false
          _seat[0].booked = true
          _seat[0].available = false

          // ..og oppdaterar databasen.
          var dbRef = firebase.database().ref('/Plassering/' + _seat[0].id)
          dbRef.transaction(function (sete) {
            if (sete) {
              sete.id = _seat[0].id
              sete.reservert = false
              sete.booked = true
            } else {
              console.log('Feilmelding for transaksjon')
            }
            return sete
          })
        })

        // Nullstiller eigne sete.
        mySeats.length = 0

        // Teikn opp på nytt når alle sete er gjennomgått.
        draw(_container)
      }
    }
  }
}
