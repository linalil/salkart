$(document).ready(function () {
  let reserved
  let sessionId
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      var isAnonymous = user.isAnonymous
      var uid = user.uid
      console.log('Det eksisterer ein brukar')
      console.log('Brukaren er anonym: ' + isAnonymous)
      console.log('Brukaren har id' + uid)
      sessionId = uid

      let dbInit = firebase.database().ref('/Saler/Sal3/Personer/' + sessionId)
      dbInit.once('value', function (snapshot) {
        if (snapshot.child('seats')) {
          console.log('Sete som er reservert er: ' + snapshot.child('seats').val())
          console.log(sessionId + ' er lik ' + snapshot.child('sessionId').val())
          let booka = String(snapshot.child('seats').val())
          reserved = booka.split(',')
          let outText = ''
          for (let i = 0; i < reserved.length; i++) {
            console.log(getVisualId(reserved[i]))
            outText += getVisualId(reserved[i]) + ' '
          }
          $('#test_tekst').html('<p>Dine valgte billetter: ' + outText + '</p')
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
      var dbRef = firebase.database().ref('/Saler/Sal3/Plassering/' + reservertSete)
      console.log(dbRef)
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
    firebase.database().ref('/Saler/Sal3/Personer/' + sessionId).remove()
  })
})
