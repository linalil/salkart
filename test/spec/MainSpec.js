describe("Setesjekking", function() {

    var sete1
    var sete2

    beforeEach(function(){
      sete1 = {
      id: 1-1,
      booked: true,
      available: false,
      }

      sete1 = {
      id: 1-2,
      booked: false,
      available: true,
      }
    })

    // Sjekke at det eksisterer eit sete
    it("setet eksisterer", function(){
      expect(sete1).not.toBe(null)
    })

    // Setet er ikkje det samme
    it("Seteobjekta er ikkje like", function(){
      expect(sete1).not.toEqual(sete2)
    })

});

//})

 // Velge billett – barn
 // Velge billett – voksen
 // Velge billett – Honnør
 // Kjøpe 1 sete
 // Kjøpe fleire sete
 // Ikkje sette att enkeltsete
 // Ikkje kunne booke/reservere sete som er reservert
 // Ikkje kunne booke/reservere sete som er booka
