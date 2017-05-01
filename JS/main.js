$(document).ready(function () {
  /* Opnar kopling til databasen og hentar inn tal rader og seter.
    Lagrar denne informasjonen i eit seteobjekt. */
  firebase.database().ref('/Saler/Sal3/').once('value', function (snapshot) {
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
      multiple: false,
      sessionId: 1
    }, options)

    // Local Variables
    // Variabel som lagrar kva sete du har trykt på.
    let mySeats = []
    var _blocks = []
    var _seats = []
    var _selected = []

    let sessionId

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
      label: null,
      block: null,
      booked: false,
      available: true,
      notavailable: false,
      selected: false,
      utilgjengelig: false
    }

    /* ----------------------------- SESSION ------------------------------- */
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
      // User is signed in.
        var isAnonymous = user.isAnonymous
        var uid = user.uid
        console.log('Det eksisterer ein brukar')
        console.log('Brukaren er anonym: ' + isAnonymous)
        console.log('Brukaren har sesjonsid: ' + uid)
        sessionId = uid

        let dbInit = firebase.database().ref('/Saler/Sal3/Personer/' + sessionId)
        dbInit.once('value', function (snapshot) {
          if (snapshot.child('seats')) {
            let tempSeats = String(snapshot.child('seats').val())
            mySeats = tempSeats.split(',')
          } else {
            mySeats = []
            console.log('Det fins ingen sete på brukaren')
          }
          initialize()
        })
      } else {
        // User is signed out.
        firebase.auth().signInAnonymously().catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code
          var errorMessage = error.message
          console.log('Feil med anonym innlogging: ' + errorCode + ' ' + errorMessage)
        })
        console.log('Brukaren er no logga inn')
      }
    })
    /* -------------------------------------------------------------------- */

    // Sjekkar kor mange sete brukar ønskjer å velje og oppdaterar pristabell.
    let numSeats = $('#select').val()
    updateTable(numSeats)

    // Metode som køyrer når select for ulike billett-typar endrar seg.
    $('#barn').change(function () {
      document.getElementById('advarsel').style.display = 'none'
      let barn = $(this).val()
      let voksen = $('#select').val()
      let honnor = $('#honnor').val()
      numSeats = parseInt(barn) + parseInt(voksen) + parseInt(honnor)
      updateTable(numSeats)
      console.log('Verdi til saman: ' + numSeats)
      clearMySeats()
    })
    $('#select').change(function () {
      document.getElementById('advarsel').style.display = 'none'
      let voksen = $(this).val()
      let barn = $('#barn').val()
      let honnor = $('#honnor').val()
      numSeats = parseInt(barn) + parseInt(voksen) + parseInt(honnor)
      updateTable(numSeats)
      console.log('Verdi til saman: ' + numSeats)
      clearMySeats()
    })
    $('#honnor').change(function () {
      document.getElementById('advarsel').style.display = 'none'
      let honnor = $(this).val()
      let barn = $('#barn').val()
      let voksen = $('#select').val()
      numSeats = parseInt(barn) + parseInt(voksen) + parseInt(honnor)
      updateTable(numSeats)
      console.log('Verdi til saman: ' + numSeats)
      clearMySeats()
    })

    var _container = this

    // Metode som køyrer når ein klikkar på ein checkbox.
    this.on('click', 'input:checkbox', function () {
      if ($(this).data('status') === 'booked' || $(this).data('status') === 'selected' || $(this).data('status') === 'utilgjengelig') {
        return false
      }
      var _id = $(this).prop('id').substr(4)

      // Viss ein skal bestille eit sete
      if (parseInt(numSeats) === 0) {
        $('#advarselstekst').html('Husk å velge antall seter!')
        document.getElementById('advarsel').style.display = 'unset'
        return false
      } else if (parseInt(numSeats) === 1) {
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

    // Metode som oppdaterar pristabell.
    function updateTable (totalSeter) {
      $('#voksen_antall').html($('#select').val())
      $('#barn_antall').html($('#barn').val())
      $('#honnor_antall').html($('#honnor').val())

      let voksenPris = parseInt(110 * parseInt($('#select').val()))
      let barnePris = parseInt(80 * parseInt($('#barn').val()))
      let honnorPris = parseInt(80 * parseInt($('#honnor').val()))

      $('#voksen_pris').html(voksenPris + ' kr')
      $('#barn_pris').html(barnePris + ' kr')
      $('#honnor_pris').html(honnorPris + ' kr')

      $('#sum_antall').html(totalSeter)
      $('#sum_pris').html(parseInt(voksenPris + barnePris + honnorPris) + ' kr')
    }

/* --------------------------------------------------------------------- */
    function initialize () {
      // Opnar databasetilkopling til 'Plassering'-greina.
      var dbInitReference = firebase.database().ref('Saler/Sal3/Plassering')

      // Første gong når ein teknar opp salkartet.
      dbInitReference.once('value', function (snapshot) {
        console.log('Initialisering av salkart... ')


        // Går gjennom seter og rader som satt i settings.
        for (var i = 0; i < settings.rows; i++) {
          let visualSeatNumber = 0
          for (var j = 0; j < settings.columns; j++) {
            // Defining ID
            let _id = i + '-' + j

            // Creating new seat object and providing ID
            var _seatObject = new seat()
            _seatObject.id = _id

            if (($.inArray(_seatObject.id, mySeats)) === -1) {
              // Dersom det er reservert (og ikkje ditt), sett status 'utilgjengeleg'
              // Setet vil då bli farga mørkegrått.
              if (snapshot.child(_id).child('utilgjengelig').val() === true) {
                _seatObject.utilgjengelig = true
              } else if (snapshot.child(_id).child('reservert').val() === true) {
                _seatObject.available = false
                _seatObject.notavailable = true
                visualSeatNumber++
              } else if (snapshot.child(_id).child('booked').val() === true) {
                _seatObject.booked = true
                _seatObject.available = false
                visualSeatNumber++
              } else if (snapshot.child(_id).child('reservert').val() === false && snapshot.child(_id).child('booked').val() === false) {
                _seatObject.available = true
                _seatObject.notavailable = false
                visualSeatNumber++
              }
            } else {
              _seatObject.selected = true
              _seatObject.notavailable = true
              visualSeatNumber++
              let label = (i + 1) + '-' + visualSeatNumber
              _seatObject.label = label
              makeGreenBox(_seatObject.label)
            }

            let label = (i + 1) + '-' + visualSeatNumber
            _seatObject.label = label
            _seats.push(_seatObject)
          }
        }
        // Teiknar opp salkartet
        draw(_container)
      })
    }

    // Dersom eit av borna under 'Plassering' endrar seg, så vil callbackmetoden under køyrast.
    var dbInitRef = firebase.database().ref('/Saler/Sal3/Plassering')
    dbInitRef.on('child_changed', function (snapshot) {
      // c er bornet der det har skjedd ei endring, altså det setet som har endra status.
      var c = snapshot.val()

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
        // Oppdaterar status til reservert.
      }

      // Teikn salkartet på nytt.
      draw(_container)
    })

    // Draw layout - metoden som teiknar opp salkart
    function draw (container) {
      container.empty()

      for (var i = 0; i < settings.rows; i++) {
        // Providing Row label
        var _row = $('<div class="row"></div>')
        var _colLabel = $('<span class="row-label">' + (i + 1) + '</span>')
        _row.append(_colLabel)

        let labNum = 0
        for (var j = 0; j < settings.columns; j++) {
          var _id = i + '-' + j

          // Finding the seat from the array
          var _seatObject = _seats.filter(function (seat) {
            return seat.id === _id
          })[0]

          var _seatClass = 'seat'

          if (_seatObject.block != null) {
            let _seatBlockColor = _blocks.filter(function (block) {
              return block.label === _seatObject.block
            })[0].color
          }
          var _checkbox = $('<input id="seat' + _seatObject.id + '" data-block="' + _seatObject.block + '" type="checkbox" />')
          var _seat
          if(_seatObject.utilgjengelig) {
            _checkbox.prop('disabled', 'disabled')
            _checkbox.attr('data-status', 'utilgjengelig')
            _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '"></label>')
          } else if (_seatObject.booked) {
            _checkbox.prop('disabled', 'disabled')
            _checkbox.attr('data-status', 'booked')
            labNum++
            _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '" title="' + (i + 1) + '-' + labNum + '"></label>')
          } else if (_seatObject.selected) {
            _checkbox.prop('checked', 'checked')
            labNum++
            _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '" title="' + (i + 1) + '-' + labNum + '"></label>')
          } else if (_seatObject.notavailable) {
            _checkbox.prop('disabled', 'disabled')
            _checkbox.attr('data-status', 'notavailable')
            labNum++
            _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '" title="' + (i + 1) + '-' + labNum + '"></label>')
          } else {
            _checkbox.attr('data-status', 'available')
            labNum++
            _seat = $('<label class="' + _seatClass + '" for="seat' + _seatObject.id + '" title="' + (i + 1) + '-' + labNum + '"></label>')
          }

          _row.append(_checkbox)
          _row.append(_seat)
        }
        container.append(_row)
      }
      // Providing Column labels
      var _rowLabel = $('<div class="row"><span class="row-label"></span></div>')
      let lab = 0
      for (var c = 0; c < settings.columns; c++) {
        var _s = _seats.filter(function (seat) {
          return seat.id === ('1-' + c)
        })[0]
        if (_s.utilgjengelig) {
          _rowLabel.append('<span class="col-label"></span>')
        } else {
          lab++
          _rowLabel.append('<span class="col-label">' + lab + '</span>')
        }
      }

      container.append(_rowLabel)
    }
/* --------------------------------------------------------------------- */
    // Select a single seat
    function selectSeat (id) {
      if ($.inArray(id, _selected) === -1) {
        if (parseInt(numSeats) === 1) {
          console.log('Slettar tidlegare enkeltsete...')
          clearMySeats()
          if (checkNoGaps(id)) {
            _selected.push(id)
            var _seatObj = _seats.filter(function (seat) {
              return seat.id === id
            })

            // Oppdaterar status til reservert.
            _seatObj[0].selected = true
            _seatObj[0].notavailable = true

            // Lagrar setet i lista over mine sete, mySeats
            mySeats.push(id)
            console.log('Reserverar ' + _seatObj[0].label)
            makeGreenBox(_seatObj[0].label)

            // Oppdaterar brukar i databasen med dette eine setet
            let dbRef = firebase.database().ref('/Saler/Sal3/Personer/' + sessionId)
            dbRef.set({
              sessionId: sessionId,
              seats: id
            })
          } else {
            if (!checkSeatGapsLeft(id)) {
              let split = id.split('-')
              let newId = split[0] + '-' + (parseInt(split[1]) - 1)
              console.log('Burde prøve å booke sete ' + newId)
              if (checkSeatGapsRight(newId)) {
                selectSeat(newId)
              } else {
                console.log('..men då ville vi berre fått ny gap')
                $('input:checkbox[id="seat' + id + '"]', scope).prop('checked', 'unchecked')
                document.getElementById('advarsel').style.display = 'unset'
              }
            } else if (!checkSeatGapsRight(id)) {
              let split = id.split('-')
              let newId = split[0] + '-' + (parseInt(split[1]) + 1)
              console.log('Burde prøve å booke sete ' + newId)
              if (checkSeatGapsLeft(newId)) {
                selectSeat(newId)
              } else {
                console.log('..men då ville vi berre fått ny gap')
                $('input:checkbox[id="seat' + id + '"]', scope).prop('checked', 'unchecked')
                document.getElementById('advarsel').style.display = 'unset'
              }
            } else {
              $('input:checkbox[id="seat' + id + '"]', scope).prop('checked', 'unchecked')
              document.getElementById('advarsel').style.display = 'unset'
            }
            draw(_container)
            return
          }
        } else {
          _selected.push(id)
          _seatObj = _seats.filter(function (seat) {
            return seat.id === id
          })

          // Oppdaterar status til reservert.
          _seatObj[0].selected = true
          _seatObj[0].notavailable = true
          console.log('Reserverar ' + _seatObj[0].label)

          // Lagrar setet i lista over mine sete, mySeats
          mySeats.push(id)
          makeGreenBox(_seatObj[0].label)
        }

        // Oppdaterar databasen.
        let dbRef = firebase.database().ref('/Saler/Sal3/Plassering/' + _seatObj[0].id)
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
      if (parseInt(numSeats) === 1) {
        firebase.database().ref('/Saler/Sal3/Personer/' + sessionId).remove()
        removeGreenBoxes()
      }
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
      var dbRef = firebase.database().ref('/Saler/Sal3/Plassering/' + _seatObj[0].id)
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

    // Select multiple seats
    function selectMultiple (start) {
      var _i = start.split('-')

      // Finn endepunktet som ein skal gå til, basert på kor mange sete ein ønskjer.
      var endX = parseInt(_i[1]) + (numSeats - 1)

      if (mySeats.length >= numSeats) {
        clearMySeats()
      }

      if (checkNoGaps(start) && checkBound(_i[0], _i[1], endX) && checkAvailable(_i[0], _i[1], endX)) {
        for (let x = parseInt(_i[1]); x <= parseInt(endX); x++) {
          $('input:checkbox[id="seat' + _i[0] + '-' + x + '"]', scope).prop('checked', 'checked')
          selectSeat(_i[0] + '-' + x)
        }
        // Oppdaterar databasen med liste over valgte sete
        let dbRef = firebase.database().ref('/Saler/Sal3/Personer/' + sessionId)
        dbRef.set({
          sessionId: sessionId,
          seats: mySeats
        })
        return true
      } else {
        if (tryReversed(_i[0], _i[1], endX)) {
          return true
        } else {
          $('input:checkbox[id="seat' + start + '"]', scope).prop('checked', 'unchecked')
          if (!checkNoGaps(start)) {
            $('#advarselstekst').html('Ugyldig seteplassering! Du kan ikke la enkeltseter stå igjen mellom reserverte og dine egne!')
          } else if (!checkBound(_i[0], _i[1], endX)) {
            $('#advarselstekst').html('Ugyldig seteplassering!')
          } else if (!checkAvailable(_i[0], _i[1], endX)) {
            $('#advarselstekst').html('Ikke nok seter tilgjengelig på valgt plass!')
          } else {
            $('#advarselstekst').html('Ugyldig seteplassering!')
          }
          document.getElementById('advarsel').style.display = 'unset'
          draw(_container)
          return false
        }
      }
    }

    // Prøvar å reservere sete i reversert rekkefølgje.
    function tryReversed (row, startX, endX) {
      for (let i = 1; i <= numSeats; i++) {
        if (parseInt(endX) - i === (settings.columns - 1) || (checkAvailable(row, (startX - i), (endX - i))) && checkBound(row, (startX - i), (endX - i))) {
          let newId = row + '-' + (startX - i)
          return selectMultiple(newId)
        }
      }
      return false
    }

    // Metode som slettar lokalt lagra sete.
    function clearMySeats () {
      if (mySeats != 'null') {
        for (let i = 0; i < mySeats.length; i++) {
          let tempId = mySeats[i]
          deselectSeat(tempId)
        }
        mySeats.length = 0
        removeGreenBoxes()
      } else {
        mySeats.length = 0
      }
      if (parseInt(numSeats) !== 1) {
        firebase.database().ref('/Saler/Sal3/Personer/' + sessionId).remove()
      }
    }

/* --------------------------------------------------------------------- */
    // Lagar grøn boks for gitt id.
    function makeGreenBox (label) {
      $('#valgte_billetter').append('<div class="valgte_billetter">' + label + '</div>')
      document.getElementById('valgte_billetter_beskrivelse').style.visibility = 'visible'
      document.getElementById('dine_valgte_billetter').style.visibility = 'visible'
    }

    // Fjernar alle grøne boksar.
    function removeGreenBoxes () {
      document.getElementById('dine_valgte_billetter').style.visibility = 'hidden'
      var mySaved = document.getElementById('valgte_billetter')
      while (mySaved.firstChild) {
        mySaved.removeChild(mySaved.firstChild)
      }
    }

/* --------------------------------------------------------------------- */

    // Sjekkar at alle sete i intervallet er tilgjengelege.
    function checkAvailable (row, startX, endX) {
      for (let i = startX; i <= endX; i++) {
        if ($('input:checkbox[id="seat' + row + '-' + i + '"]', scope).data('status') === 'notavailable' ||
        $('input:checkbox[id="seat' + row + '-' + i + '"]', scope).data('status') === 'booked' ||
        $('input:checkbox[id="seat' + row + '-' + i + '"]', scope).data('status') === 'selected' ||
        $('input:checkbox[id="seat' + row + '-' + i + '"]', scope).data('status') === 'utilgjengelig') {
          return false
        }
      }
      return true
    }

    // Sjekkar at heile intervallet er innanfor salkartet.
    function checkBound (row, startX, endX) {
      // Ved ulikt tal seter på ulike rader, kan på sikt row brukast her.
      for (let i = startX; i <= endX; i++) {
        if (i >= settings.columns) {
          console.log('Setet er utanfor salkartet på hogre side')
          return false
        } else if (i < 0) {
          console.log('Setet er utanfor salkartet på venstre side')
          return false
        } else {
        }
      }
      return true
    }

    // Metode som sjekkar at det ikkje er gaps på venstre eller høgre side.
    function checkNoGaps (startId) {
      if (checkSeatGapsLeft(startId) && checkSeatGapsRight(startId)) {
        document.getElementById('advarsel').style.display = 'none'
        return true
      } else {
        $('#advarselstekst').html('Ugyldig seteplassering! Du kan ikke la enkeltseter stå igjen mellom reserverte og dine egne!')
        if (!checkSeatGapsLeft(startId)) {
          console.log('Gap til venstre')
        } else if (!checkSeatGapsRight(startId)) {
          console.log('Gap til hogre')
        }
        return false
      }
    }

    // Metode som sjekkar for gaps på venstre side.
    function checkSeatGapsLeft (startId) {
      let _i = startId.split('-')
      let doubleLeft = parseInt(_i[1]) - 2
      let left = parseInt(_i[1]) - 1
      // Sjekkar om setet to hakk til venstre i salen er meir enn eit hakk frå kanten.
      if (doubleLeft >= 0) {
        if (checkBooked(_i[0] + '-' + doubleLeft) || checkReserved(_i[0] + '-' + doubleLeft)) {
          if (!checkBooked(_i[0] + '-' + left) && !checkReserved(_i[0] + '-' + left)) {
            return false
          }
        }
      }
      return true
    }

    // Metode som sjekkar for gaps på høgre side.
    function checkSeatGapsRight (startId) {
      let _i = startId.split('-')
      let endSeat = parseInt(_i[1]) + parseInt(numSeats - 1)
      let doubleRight = parseInt(endSeat + 2)
      let right = parseInt(endSeat + 1)

      if (doubleRight <= (settings.columns - 1)) {
        if (checkBooked(_i[0] + '-' + doubleRight) || checkReserved(_i[0] + '-' + doubleRight)) {
          if (!checkBooked(_i[0] + '-' + right) && !checkReserved(_i[0] + '-' + right)) {
            return false
          }
        }
      }
      return true
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
/* --------------------------------------------------------------------- */

    // Metode som nullstiller kart og database når ein trykker på nullstill.
    $('#nullstill').click(function () {
      $.each(_seats, function (i, v) {
        var _this = this
        var _seat = _seats.filter(function (seat) {
          return seat.id === _this.id
        })

        if (!_seat[0].utilgjengelig) {
          _seat[0].available = true
          _seat[0].booked = false
          _seat[0].selected = false
          _seat[0].notavailable = false

          var dbRef = firebase.database().ref('/Saler/Sal3/Plassering/' + _seat[0].id)
          dbRef.set({
            id: _seat[0].id,
            reservert: false,
            booked: false
          })
        }
      })
      removeGreenBoxes()
      clearMySeats()
      updateTable()
      draw(_container)
    })

/* --------------------------------------------------------------------- */
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
          var dbRef = firebase.database().ref('/Saler/Sal3/Plassering/' + _seat[0].id)
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
        removeGreenBoxes()
        clearMySeats()
        firebase.database().ref('/Saler/Sal3/Personer/' + sessionId).remove()
        document.getElementById('valgte_billetter_beskrivelse').style.visibility = 'hidden'
        // Teikn opp på nytt når alle sete er gjennomgått.
        draw(_container)
      }
    }
  }
}
