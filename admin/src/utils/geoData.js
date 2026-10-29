export const BD_DIVISIONS = [
  'Dhaka',
  'Chattagram',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];

export const BD_DISTRICTS_BY_DIVISION = {
  Dhaka: [
    'Dhaka',
    'Gazipur',
    'Narayanganj',
    'Tangail',
    'Narsingdi',
    'Faridpur',
    'Gopalganj',
    'Madaripur',
    'Manikganj',
    'Munshiganj',
    'Rajbari',
    'Shariatpur',
    'Kishoreganj'
  ],
  Chattagram: [
    'Chattagram',
    "Cox's Bazar",
    'Cumilla',
    'Feni',
    'Brahmanbaria',
    'Noakhali',
    'Chandpur',
    'Lakshmipur',
    'Rangamati',
    'Khagrachhari',
    'Bandarban'
  ],
  Rajshahi: [
    'Rajshahi',
    'Bogura',
    'Pabna',
    'Sirajganj',
    'Naogaon',
    'Natore',
    'Chapainawabganj',
    'Joypurhat'
  ],
  Khulna: [
    'Khulna',
    'Jashore',
    'Kushtia',
    'Satkhira',
    'Bagerhat',
    'Chuadanga',
    'Jhenaidah',
    'Magura',
    'Meherpur',
    'Narail'
  ],
  Barisal: [
    'Barisal',
    'Patuakhali',
    'Bhola',
    'Pirojpur',
    'Barguna',
    'Jhalokathi'
  ],
  Sylhet: [
    'Sylhet',
    'Moulvibazar',
    'Habiganj',
    'Sunamganj'
  ],
  Rangpur: [
    'Rangpur',
    'Dinajpur',
    'Gaibandha',
    'Kurigram',
    'Lalmonirhat',
    'Nilphamari',
    'Panchagarh',
    'Thakurgaon'
  ],
  Mymensingh: [
    'Mymensingh',
    'Jamalpur',
    'Netrokona',
    'Sherpur'
  ]
};

export const ALL_BD_DISTRICTS = Object.values(BD_DISTRICTS_BY_DIVISION).flat();
