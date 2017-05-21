import * as firebase from 'firebase'
$(document).ready(function () {
  let reserved
  let sessionId
  let sal = sessionStorage.sal
  let arr = sessionStorage.arr
  let purchaseFinished = false
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
  let mySeats = []

  firebase.database().ref('/Arrangement/' + arr).once('value', function (snapshot) {
    let arrangement = snapshot.val()
    let arrInfo = '<div class="reservasjonsinfo" id="' + arrangement.sal +
    '"><div class="event"><div class="bilde"><img src="img/' +
    arrangement.bilde + '" alt="konsertbilde"/></div><div class="eventinfo"><div class="tittel">' +
    arrangement.title + '</div><div class="sjanger">' + arrangement.sjanger + '</div><div class="lengde">' +
    arrangement.lengde + '</div></div></div><div class="tidspunkt"><div class="dato">' +
    arrangement.dato + '</div><div class="tid">' + arrangement.tid + '</div><div class="sal">' +
    arrangement.sal + '</div></div></div>'
    $('#valgt_arrangement').append(arrInfo)
  })

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      sessionId = user.uid

      firebase.database().ref('/Saler/' + sal + '/Personer/' + sessionId).once('value', function (snapshot) {
        if (snapshot.child('seats').val() != null) {
          console.log('Sete som er reservert er: ' + snapshot.child('seats').val())
          reserved = String(snapshot.child('seats').val()).split(',')

          for (let i = 0; i < reserved.length; i++) {
            let _seat = new seat()
            _seat.id = reserved[i]
            firebase.database().ref('/Saler/' + sal + '/Plassering/' + _seat.id).once('value', function (snapshot) {
              let seat = snapshot.val()
              _seat.label = seat.label
              mySeats.push(_seat)
              $('#valgte_billettbokser').append('<div class="valgte_billetter">' + seat.label + '</div>')
            })
          }

        } else {
          console.log('Det fins ingen sete på brukaren')
        }
        console.log('Ferdig med db-bolk')
      })
    } else {
      console.log('Brukaren er ikkje logga inn med nokon sesjon')
    }
  })


  function validateFields () {
    let name = $('#navn').val()
    let email = $('#e-mail').val()
    let tlf = $('#tlf').val()

    if (name != '' && email != '' && tlf != '') {
      console.log('Inputfelt godkjent')
      return true
    } else {
      console.log('Inputfelt ikkje godkjent!!')
      return false
    }
  }

  $('#kjop').click(function () {
    // TODO: Fiks inputvalidering
    if (!purchaseFinished && mySeats != 'null' && validateFields()) {
      let name = $('#navn').val()
      let email = $('#e-mail').val()
      let tlf = $('#tlf').val()

      // var credential = firebase.auth.EmailAuthProvider.credential(email, tlf)

      /*auth.currentUser.link(credential).then(function(user) {
        console.log('Anonymous account successfully upgraded', user)
      }, function (error) {
        console.log('Error upgrading anonymous account', error)
      })*/

      console.log('Tektstfelt sin verdi: ' + name + email + tlf)
      $.each(mySeats, function (i, v) {
        let _sete = this
        console.log('Skal lagre: id=' + _sete.id + ', reservert = false, booked = true og label=' + _sete.label)
        var dbRef = firebase.database().ref('/Saler/' + sal + '/Plassering/' + _sete.id)
        dbRef.update({
          id: _sete.id,
          reservert: false,
          booked: true,
          label: _sete.label
        })
      })

      console.log('Skal no lagre seta på personen!')
      firebase.database().ref('/Saler/' + sal + '/Personer/' + sessionId).remove()
      firebase.database().ref('/Saler/' + sal + '/Personer/').push({
          name: name,
          email: email,
          tlf: tlf,
          seats: reserved,
          sessionId: sessionId
      })

      purchaseFinished = true
      window.location.href = 'index.html'
    } else {
      console.log('Feilmelding for kjøp!')
      return
    }
  })
})
