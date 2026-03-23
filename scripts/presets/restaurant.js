module.exports = {
  name: "restaurant",
  description: "Full restaurant — gallery, pricing, reservations, floating CTA",
  base: "restaurant",
  sections: [
    { name: "stats",         variant: "counters"   }, // animated counters after hero
    { name: "gallery-strip", variant: "default"    }, // autoscrolling image strip
    { name: "google-reviews",variant: "default"    }, // dark Google review CTA
    { name: "pricing",       variant: "cards"      }, // meal deals / packages
    { name: "reservation",   variant: "formspree"  }, // full-screen booking modal
    { name: "reserve-bar",   variant: "default"    }, // mobile sticky reserve/order bar
    { name: "floating-cta",  variant: "default"    }, // mobile bottom bar: call/whatsapp/book
  ],
};
