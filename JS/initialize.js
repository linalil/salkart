
$(document).ready(function () {

  var dbInitRef = firebase.database().ref('/Arrangement/').once('value').then(function (snapshot) {
    console.log(snapshot.val())
    let arr = snapshot.val()
    let tabIndex = 0
    $.each(arr, function (i, v) {
      tabIndex++
      let arrangement = this
      let arrInfo = '<div class="reservasjonsinfo hover" id="' + arrangement.sal +
      '" tabindex="' + tabIndex + '"><div class="event"><div class="bilde"><img src="' +
      arrangement.bilde + '" alt="konsertbilde"/></div><div class="eventinfo"><div class="tittel">' +
      arrangement.tittel + '</div><div class="sjanger">' + arrangement.sjanger + '</div><div class="lengde">' +
      arrangement.lengde + '</div></div></div><div class="tidspunkt"><div class="dato">' +
      arrangement.dato + '</div><div class="tid">' + arrangement.tid + '</div><div class="sal">' +
      arrangement.sal + '</div></div></div>'
      $('#arrangement').append(arrInfo)
    })
  })



  $('#sal1').click(function () {
    sessionStorage.clear()
    sessionStorage.setItem('sal', 'Sal1')
    console.log(sessionStorage.sal)
  })

  $('#sal2').click(function () {
    sessionStorage.clear()
    sessionStorage.setItem('sal', 'Sal2')
    console.log(sessionStorage.sal)
  })

  $('#sal3').click(function () {
    sessionStorage.clear()
    sessionStorage.setItem('sal', 'Sal3')
    console.log(sessionStorage.sal)
  })

  $('#til_billett').click(function () {
    if (sessionStorage.sal != null) {
      console.log('Du har valt eit arrangement, lov til å gå vidare')
      window.location.href = 'billettvalg.html'
    } else {
      console.log('Ingen arr, ikkje gå vidare')
    }
  })

})
