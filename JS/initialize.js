
$(document).ready(function () {

  var dbInitRef = firebase.database().ref('/Arrangement/').once('value').then(function (snapshot) {
    let arr = snapshot.val()
    let tabIndex = 0
    $.each(arr, function (i, v) {
      tabIndex++
      let arrangement = this

      let arrInfo = '<div class="reservasjonsinfo hover" id="' + arrangement.sal +
      '" tabindex="' + tabIndex + '"><div class="event"><div class="bilde"><img src="img/' +
      arrangement.bilde + '" alt="konsertbilde"/></div><div class="eventinfo"><div class="tittel">' +
      arrangement.title + '</div><div class="sjanger">' + arrangement.sjanger + '</div><div class="lengde">' +
      arrangement.lengde + '</div></div></div><div class="tidspunkt"><div class="dato">' +
      arrangement.dato + '</div><div class="tid">' + arrangement.tid + '</div><div class="sal">' +
      arrangement.sal + '</div></div></div>'
      $('#arrangement').append(arrInfo)

      let sal = arrangement.sal
      let arr = 'Arrangement' + tabIndex
      $('#' + sal).click(function () {
        sessionStorage.clear()
        sessionStorage.setItem('sal', sal)
        sessionStorage.setItem('arr', arr)
        console.log(sessionStorage.sal)
      })
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
})
