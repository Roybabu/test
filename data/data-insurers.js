/* ============================================================================
   INSURERS
   ============================================================================

   The master list of UAE motor insurers. This fills the insurer dropdown on
   the page and the suggestions in the "Add workshop" form.

   TO ADD AN INSURER: copy the template below and fill it in.

     {
       name:  "Insurer name as it should appear",
       type:  "Conventional",
       logo:  "",
       phone: "",
       notes: ""
     },

   IMPORTANT: whatever you write in name: here must match, character for
   character, the names used in the insurers: [...] lists in
   data-nonagency.js. If the two don't match exactly, the filter will show
   the insurer but find no workshops.

   type: is either "Conventional" or "Takaful".

   logo: is optional. Put image files in a folder called  logos-insurers  next
   to index.html. By default the app looks for the insurer name turned into a
   filename, which gets long — so you can name a shorter file here instead:

       logo: "sukoon.png"

   An insurer with no image file shows a lettered badge instead, so you can
   add logos gradually and nothing ever looks broken.

   claimwireId: optional. Set this only on an insurer Claim.Wire has a
   claims playbook for (see data/data-claimwire-playbooks.js) — it's the
   key that playbook is filed under. This is the one field Claim.Wire
   reads from this list (via its own COMPANIES derivation), so once set,
   treat it as a stable id: renaming it here breaks the matching
   SEED_PLAYBOOKS entry and anyone's locally-saved edits to that insurer.
   ============================================================================ */

const insurerData = [

  {
    name:  "ADNIC (Abu Dhabi National Insurance Company)",
    type:  "Conventional",
    phone: "",
    notes: "One of the largest UAE insurers by premium.",
    claimwireId: "adnic"
  },
  {
    name:  "Abu Dhabi National Takaful Company",
    type:  "Takaful",
    phone: "",
    notes: ""
  },
  {
    name:  "Adamjee Insurance",
    type:  "Conventional",
    phone: "",
    notes: "Foreign (Pakistan-origin) insurer with UAE presence."
  },
  {
    name:  "Al Ain Ahlia Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Al Buhaira National Insurance Company (ABNIC)",
    type:  "Conventional",
    phone: "",
    notes: "Based in Sharjah."
  },
  {
    name:  "Al Dhafra National Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Al Fujairah National Insurance Company (AFNIC)",
    type:  "Conventional",
    phone: "",
    notes: "Active in Abu Dhabi, Dubai, Fujairah, Dibba and Sharjah.",
    claimwireId: "afnic"
  },
  {
    name:  "Al Ittihad Al Watani Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "Name as commonly referenced — verify exact registered name before formal correspondence."
  },
  {
    name:  "Al Khazna Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "CAUTION: Central Bank of the UAE revoked this company's licence — do not treat as an active insurer without verifying current status."
  },
  {
    name:  "Al Sagr National Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "Founded 1979.",
    claimwireId: "al-sagar-insurance"
  },
  {
    name:  "Al Wathba National Insurance Company (AWNIC)",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Alliance Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Arabia Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "Foreign (Lebanon-origin) insurer with UAE branch."
  },
  {
    name:  "Dar Al Takaful",
    type:  "Takaful",
    phone: "",
    notes: ""
  },
  {
    name:  "Damana",
    type:  "Conventional",
    phone: "",
    notes: "Listed as provided — verify exact company identity/registration before relying on this name."
  },
  {
    name:  "Dubai Insurance Company (DIC)",
    type:  "Conventional",
    phone: "",
    notes: "50+ years in the market. Not to be confused with Dubai National Insurance & Reinsurance Company (DNIRC) — separate entity.",
    claimwireId: "dubai-insurance-company"
  },
  {
    name:  "Dubai Islamic Insurance & Reinsurance Co. (AMAN)",
    type:  "Takaful",
    phone: "",
    notes: ""
  },
  {
    name:  "Dubai National Insurance & Reinsurance Company (DNIRC)",
    type:  "Conventional",
    phone: "",
    notes: "Separate company from Dubai Insurance Company (DIC) — do not conflate the two.",
    claimwireId: "dni"
  },
  {
    name:  "Emirates Insurance Company (EIC)",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "GIG Gulf (formerly AXA Gulf)",
    type:  "Conventional",
    phone: "",
    notes: "Formed from AXA Gulf; separate from Sukoon (formerly Oman Insurance) — verify current corporate name on any policy before filing.",
    claimwireId: "gig-gulf-axa"
  },
  {
    name:  "Insurance House",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Iran Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "Foreign insurer with UAE branch.",
    claimwireId: "iran-insurance-company"
  },
  {
    name:  "LIVA Insurance",
    type:  "Conventional",
    phone: "",
    notes: "",
    claimwireId: "liva-insurance"
  },
  {
    name:  "Methaq Takaful Insurance Company",
    type:  "Takaful",
    phone: "",
    notes: "",
    claimwireId: "methaq"
  },
  {
    name:  "National General Insurance Company (NGI)",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "National Life & General Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "New India Assurance (UAE branch)",
    type:  "Conventional",
    phone: "",
    notes: "Foreign (Indian) insurer operating via UAE branch."
  },
  {
    name:  "Noor Takaful",
    type:  "Takaful",
    phone: "",
    notes: "Claims for this brand are handled under Watania Takaful — see that entry for the Claim.Wire playbook."
  },
  {
    name:  "Orient Insurance PJSC",
    type:  "Conventional",
    phone: "",
    notes: "Part of the Al-Futtaim Group, 40+ years in market."
  },
  {
    name:  "Orient Takaful",
    type:  "Takaful",
    phone: "",
    notes: "Subsidiary of Orient Insurance, active since 2017."
  },
  {
    name:  "Oriental Insurance Company (UAE branch)",
    type:  "Conventional",
    phone: "",
    notes: "Foreign (Indian) insurer operating via UAE branch.",
    claimwireId: "oriental-insurance"
  },
  {
    name:  "Qatar Insurance Company (QIC)",
    type:  "Conventional",
    phone: "",
    notes: "Regional insurer with UAE operations.",
    claimwireId: "qatar-insurance-company"
  },
  {
    name:  "RAK Insurance (RAK National Insurance Company)",
    type:  "Conventional",
    phone: "",
    notes: "Based in Ras Al Khaimah."
  },
  {
    name:  "Salama (Islamic Arab Insurance Company)",
    type:  "Takaful",
    phone: "",
    notes: "45+ years, Sharia-compliant.",
    claimwireId: "salama-insurance"
  },
  {
    name:  "Sharjah Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Sukoon Insurance (formerly Oman Insurance Company)",
    type:  "Conventional",
    phone: "",
    notes: "One of the oldest and largest UAE insurers; rebranded from Oman Insurance Company to Sukoon.",
    claimwireId: "sukoon-insurance"
  },
  {
    name:  "Sukoon Takaful (formerly Arabian Scandinavian Insurance Co. / ASCANA)",
    type:  "Takaful",
    phone: "",
    notes: "Sharia-compliant since 2005; rebranded under the Sukoon group."
  },
  {
    name:  "Takaful Emarat",
    type:  "Takaful",
    phone: "",
    notes: "Founded 2008."
  },
  {
    name:  "Tokio Marine",
    type:  "Conventional",
    phone: "",
    notes: "Japanese insurer operating in the UAE under Al-Futtaim Group sponsorship.",
    claimwireId: "tokio-marine"
  },
  {
    name:  "Union Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "Founded 1998."
  },
  {
    name:  "United Fidelity Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: "",
    claimwireId: "fidelity-insurance"
  },
  {
    name:  "United Insurance Company",
    type:  "Conventional",
    phone: "",
    notes: ""
  },
  {
    name:  "Watania Takaful (National Takaful Company)",
    type:  "Takaful",
    phone: "",
    notes: "Founded 2008. Also referred to as Noor Takaful in some correspondence — see that entry.",
    claimwireId: "noor-takaful-watania"
  },
  {
    name:  "Yas Takaful (formerly Hilal Takaful)",
    type:  "Takaful",
    phone: "",
    notes: ""
  },

];
