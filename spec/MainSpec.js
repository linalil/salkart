// TEST test
  describe("Jasmine", function() {
    it("kan kjøre en test", function() {
      expect(true).toBe(true);
    });
  });

describe("Valgt arrangement", function(){
  beforeEach(function() {
    jasmine.getFixtures().fixturesPath = '../';
  });

  it("burde vises på siden", function(){
    loadFixtures('betaling.html')
    expect(true).toBe(true);
    //expect($('#valgt_arrangement')).toExist()
  });
});



 // Velge billett – barn
 // Velge billett – voksen
 // Velge billett – Honnør
 // Kjøpe 1 sete
 // Kjøpe fleire sete
 // Ikkje sette att enkeltsete
 // Ikkje kunne booke/reservere sete som er reservert
 // Ikkje kunne booke/reservere sete som er booka


 /*-------------- UI --------------------*/
