$(document).ready(function () {
  let reserved
  let sessionId
  let sal = sessionStorage.sal
  let arr = sessionStorage.arr

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
      var isAnonymous = user.isAnonymous
      var uid = user.uid
      console.log('Det eksisterer ein brukar')
      console.log('Brukaren er anonym: ' + isAnonymous)
      console.log('Brukaren har id' + uid)
      sessionId = uid

      firebase.database().ref('/Saler/' + sal + '/Personer/' + sessionId).once('value', function (snapshot) {
        if (snapshot.child('seats')) {
          console.log('Sete som er reservert er: ' + snapshot.child('seats').val())
          let booka = String(snapshot.child('seats').val())
          reserved = booka.split(',')
          console.log('reservert sin size' + reserved.length)

          for (let i = 0; i < reserved.length; i++) {
            let id = reserved[i]
            console.log('Er inne i forløkka')
            firebase.database().ref('/Saler/' + sal + '/Plassering/' + id).once('value', function (snapshot) {
              let seat = snapshot.val()
              console.log(snapshot.val())
              $('#test_tekst').append('<div class="valgte_billetter">' + seat.label + '</div>')
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



  function getVisualId (id) {
    let _i = id.split('-')
    return (parseInt(_i[0]) + 1) + '-' + (parseInt(_i[1]) + 1)
  }

  $('#kjop').click(function () {
    // TODO: Fiks inputvalidering
    // if(alle tekstfelt fylt ut){ kjøp billett(ar) }

    $.each(reserved, function (i, v) {
      let reservertSete = String(this)
      console.log('Reservert sete: ' + reservertSete)

      var dbRef = firebase.database().ref('/Saler/' + sal + '/Plassering/' + reservertSete)
      dbRef.transaction(function (sete) {
        if (sete) {
          sete.id = reservertSete
          sete.reservert = false
          sete.booked = true
        } else {
          console.log('Feilmelding for transaksjon')
        }
        return sete
      })
    })
    firebase.database().ref('/Saler/' + sal + '/Personer/' + sessionId).remove()
  })
})
