// TEST test
  describe("Jasmine", function() {
    it("kan kjøre en test", function() {
      expect(true).toBe(true);
    })
  })

describe("Antall seter", function(){
  it("bør stemme med riktig antall seter", function(){
    firebase.database().ref('Saler/Sal1/Sal_Info/SeterTotal').once('value', function(snapshot){
      expect(snapshot.val()).toBe('67');
    })
  })
})

describe('Setesjekk', function () {

})


 // Velge billett – barn
 // Velge billett – voksen
 // Velge billett – Honnør
 // Kjøpe 1 sete
 // Kjøpe fleire sete
 // Ikkje sette att enkeltsete
 // Ikkje kunne booke/reservere sete som er reservert
 // Ikkje kunne booke/reservere sete som er booka


 /*-------------- UI --------------------*/
