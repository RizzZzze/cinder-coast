// Cinder Coast story: chapter and mission data (eight missions, three activities).
// Stage 1 plays Mission 1, "Wrong Tow", end to end. Missions 2–8 are listed
// with their districts and unlock in order in Stage 2.
(function () {
  var CC = window.CinderCoast;
  CC.story = {
    chapters: [
      { n: 1, name: 'Wrong Tow', district: 'Saltmarsh Quay' },
      { n: 2, name: 'Dead Drop', district: 'Old Mercado' },
      { n: 3, name: 'Pier Nine', district: 'Saltmarsh Quay' },
      { n: 4, name: 'Glass Floor', district: 'Sunfield Strip' },
      { n: 5, name: 'Convoy', district: 'Corvane Bridge' },
      { n: 6, name: 'Funicular', district: 'Brightwater Heights' },
      { n: 7, name: 'Lantern Light', district: 'Lantern Park' },
      { n: 8, name: 'Tidewater', district: 'Ironbridge Yards' }
    ],
    missions: [
      { id: 1, name: 'Wrong Tow', district: 'Saltmarsh Quay', payout: 450, standing: 8,
        brief: 'Tow a car from a pier. Police arrive. Escape to the Mercado garage.' },
      { id: 2, name: 'Dead Drop', district: 'Old Mercado', payout: 600, standing: 10,
        brief: 'Retrieve a parcel from a stall. Ambush in the arcades, pistol combat on foot.' },
      { id: 3, name: 'Pier Nine', district: 'Saltmarsh Quay', payout: 800, standing: 12,
        brief: 'Drive a Ferro Nomad through the rail crossing to Pier Nine. Find Tomas\u2019s locker.' },
      { id: 4, name: 'Glass Floor', district: 'Sunfield Strip', payout: 1000, standing: 14,
        brief: 'Infiltrate the Glasswing\u2019s service lifts. Combat in a hotel corridor.' },
      { id: 5, name: 'Convoy', district: 'Corvane Bridge', payout: 1200, standing: 16,
        brief: 'Follow a Brasswater Haul across the bridge. Disable the lorry\u2019s engine.' },
      { id: 6, name: 'Funicular', district: 'Brightwater Heights', payout: 1400, standing: 18,
        brief: 'Chase Odile Sarr up the hill, ending on the funicular platform.' },
      { id: 7, name: 'Lantern Light', district: 'Lantern Park', payout: 1800, standing: 22,
        brief: 'Confront Captain Roque at the foot of the Halo Tower. Recover the ledger.' },
      { id: 8, name: 'Tidewater', district: 'Ironbridge Yards', payout: 2500, standing: 30,
        brief: 'Assault the syndicate freight yard and end the freight line.' }
    ],
    activities: [
      { id: 'tow', name: 'Tow Calls', pay: 180, brief: 'Tow a broken-down car to the drop-off before the timer runs out.' },
      { id: 'courier', name: 'Courier Runs', pay: 220, brief: 'Deliver a package across two districts within a time limit.' },
      { id: 'chop', name: 'Chop Orders', pay: 320, brief: 'Steal a named vehicle and deliver it intact to a garage in Old Mercado.' }
    ]
  };
})();
