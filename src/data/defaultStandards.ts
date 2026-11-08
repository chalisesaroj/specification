import { StandardSpecification, SpecSection } from '../types/spec';

// Helper to wrap flat rows into structured sections with integer S.N. points 1, 2, 3...
function createSectionsFromRows(
  rows: [string, string][],
  customSectionName?: string,
  meta?: { scope?: string; delivery?: string }
): SpecSection[] {
  const finalRows: [string, string][] = [];

  const hasScope = rows.some(([p]) => p.toLowerCase().includes('scope') || p.toLowerCase().includes('general'));
  const hasDelivery = rows.some(([p]) => p.toLowerCase().includes('delivery'));

  if (!hasScope && meta?.scope) {
    finalRows.push(['Vehicle Scope & General Description', meta.scope]);
  }

  rows.forEach(([p, r]) => {
    if (p.toLowerCase() === 'general') {
      finalRows.push(['Vehicle Scope & General Description', r]);
    } else {
      finalRows.push([p, r]);
    }
  });

  if (!hasDelivery) {
    finalRows.push(['Delivery Destination', meta?.delivery || 'Office of the Municipal Executive / designated division site']);
  }

  return [
    {
      id: 'sec-1',
      title: customSectionName || 'Technical Specifications & Requirements',
      order: 1,
      rows: finalRows.map(([param, req], idx) => ({
        id: `r-${idx + 1}`,
        itemNumber: String(idx + 1), // S.N. points as 1, 2, 3...
        parameter: param,
        requirement: req,
        compliance: 'Complied' as const,
      })),
    },
  ];
}

export const DEFAULT_STANDARDS: StandardSpecification[] = [
  // 1. 4WD Double Cab Pickup (From Reference Code)
  {
    id: 'std-pickup-4wd-001',
    title: '4WD Double Cab Pickup Vehicle',
    category: '4WD Double Cab Pickup',
    description: 'Right Hand Drive model with two- and four-wheel drive, suitable for driving both in ON-ROAD and OFF-ROAD conditions of Nepal.',
    version: '2.5',
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Four-Wheel Drive Double Cab Pickup Vehicle',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Four-Wheel Drive Double Cab Pickup Vehicle',
      fiscalYear: '2083/84',
      vehicleCategory: '4WD Double Cab Pickup',
      vehicleDescription: '4WD Double Cab Pickup, Right Hand Drive model with high ground clearance (2025 or later manufacture)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty after acceptance',
      sections: createSectionsFromRows([
        ['General', '4WD Double Cab Pickup, Right Hand Drive model with two- and four-wheel drive, suitable for driving both in ON-ROAD and OFF-ROAD conditions.'],
        ['Engine', 'Engine displacement of at least 2000 CC. Four stroke, water cooled diesel engine, developing rated maximum power output not less than 140 bhp and maximum torque not less than 320 N-m at rated RPM.'],
        ['Emission Standard', 'The emission standard of the offered vehicle must be in compliance with or superior to the applicable standard as prescribed by "Nepal Vehicle Mass Emission Standard 2069 (Euro III)".'],
        ['Gauges', 'Fitted with all gauges, indicators and signals necessary for efficient operation and maintenance.'],
        ['Transmission', 'Manual shift, at least six forward and one reverse, all forward synchromesh, floor mounted, 4WD engaged through control at driver.'],
        ['Ground Clearance / Model', 'High ground clearance preferred, minimum 210 mm. The manufacture year of the vehicle shall be 2025 or later.'],
        ['Turning Radius / Fuel Tank', 'Turning radius less than 7 m. Fuel tank not less than 75 ltr.'],
        ['Suspension', 'Front: Double wishbone with coil spring and stabilizer, shock absorber. Rear: Leaf spring suspension.'],
        ['Tyres', 'Standard size.'],
        ['Dimensions', 'Wheel base at least 3010 mm; Overall width at least 1820 mm; Overall length at least 5170 mm; Overall height at least 1910 mm; GVW at least 3150 kg.'],
        ['Steering', 'Hydraulic Power Steering.'],
        ['Brakes', 'Front caliper type ventilated disc, rear drum type, and parking brake.'],
        ['Cab', '4 doors, all metallic cab with insulated roof, right hand drive, laminated glass windscreen, wipers, glass windows on doors.'],
        ['Chassis and Frame', 'Steel, heavy duty high rigidity frame structure suitable for rough road conditions.'],
        ['Essential Accessories', 'Headlight, tail and rear light, reversing light and turn signals; Cabin lights and fog lamps; Speedometer / odometer; Spare wheel with tyre and tube; Front seat belts; Automatic climate control AC; Defroster / Heater; Central locking; Remote keyless entry; Power windows; Audio system; Jack with handle; Dual airbags; ABS; Reverse parking camera; Bedliner & rollbar; Micro hybrid system.'],
        ['Instructions', 'All signs and instructions in the vehicle shall be in English.'],
        ['Manuals', "One copy of the Operator's and Owner's Instructions in English shall be supplied."],
        ['Tools', 'A set of tools with a tool bag shall be supplied.'],
        ['Color', 'Standard colour.'],
        ['Warranty', 'Manufacturer shall provide a minimum of one year warranty after acceptance.']
      ])
    }
  },

  // 2. Car (Sedan / Hatchback) (From Reference Code)
  {
    id: 'std-car-002',
    title: 'Car (Sedan / Hatchback)',
    category: 'Car (Sedan / Hatchback)',
    description: 'Four door, Right Hand Drive Car suitable to operate in rough and hilly road condition of Nepal, seating capacity at least 5 persons.',
    version: '2.0',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Car',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Car',
      fiscalYear: '2083/84',
      vehicleCategory: 'Car (Sedan / Hatchback)',
      vehicleDescription: 'Four door, Right Hand Drive Gasoline Passenger Car (seating capacity min 5 persons)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty and one year free servicing after acceptance',
      sections: createSectionsFromRows([
        ['General', 'Four door, Right Hand Drive Car suitable to operate in rough and hilly road condition of Nepal. Shall have seating capacity for at least 5 persons including driver.'],
        ['Engine', 'Four stroke, water cooled gasoline engine, engine volume not less than 995 cc, developing maximum power output not less than 65 PS and maximum torque not less than 85 Nm at governed RPM.'],
        ['Emission Standard', 'The emission standard of the offered vehicle must be in compliance with or superior to the applicable standard as prescribed by Nepal Vehicle Mass Emission Standard which is to be certified by Department of Transport Management.'],
        ['Turning Radius', 'Not more than 4.7 m. Less turning radius preferred.'],
        ['Dimensions', 'Length: not less than 3600 mm; Width: not less than 1600 mm; Height: not less than 1500 mm; Wheelbase: not less than 2400 mm.'],
        ['Gauges', 'Fitted with all gauges, indicators and signals necessary for efficient operation, functional monitoring, vehicle performance and maintenance.'],
        ['Transmission', 'Manual shift, at least five forward and one reverse, floor mounted.'],
        ['Ground Clearance', 'Minimum 170 mm.'],
        ['Suspension', 'McPherson strut / coil spring / anti-roll bar / independent lower wishbone for front wheel and torsion beam for rear wheel.'],
        ['Tyres', 'Standard size.'],
        ['Steering', 'Power assisted / Power steering.'],
        ['Brakes', 'Front disc type, rear drum type, hydraulic operated on all wheels with parking brake.'],
        ['Cab', 'Four side doors and separate luggage compartment at the rear. All metallic cab with insulated roof, right hand drive, tinted laminated door glasses.'],
        ['Chassis & Frame', 'Steel, heavy duty suitable for rough road condition.'],
        ['Essential Accessories', 'Head light, tail and rear light, reversing light and turn signals; Cabin lights; A/C and Heater; Spare wheel with tyre and tube; Front seat belts; ABS + EBD; Air bags; Chrome grill; Body colour door handle; Electrically adjustable ORVM; 60:40 back seat flip; Idle start/stop function; Parking sensor.'],
        ['Instructions', 'All signs and instructions in the vehicle shall be in English.'],
        ['Manuals', "One copy of the Operator's and Owner's Instructions and Maintenance manual in English shall be supplied with each vehicle."],
        ['Tools', 'A set of tools with a tool bag, as required for general maintenance, shall be supplied with each unit.'],
        ['Color', 'Standard colour.'],
        ['Warranty & Maintenance', 'Manufacturer shall provide a minimum of one year warranty and one year free servicing after acceptance.'],
        ['Delivery', 'The vehicle shall be delivered to the Office of the Municipal Executive, Pokhara Metropolitan City.']
      ])
    }
  },

  // 3. Jeep (2WD Hardtop) (From Reference Code)
  {
    id: 'std-jeep-003',
    title: 'Jeep (2WD Hardtop)',
    category: 'Jeep (2WD Hardtop)',
    description: 'Five door, Right Hand Drive, Two Wheel drive hardtop jeep for rough and hilly road condition of Nepal, seating min 7 persons.',
    version: '2.1',
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Two-Wheel Drive Hardtop Jeep',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Two-Wheel Drive Hardtop Jeep',
      fiscalYear: '2083/84',
      vehicleCategory: 'Jeep (2WD Hardtop)',
      vehicleDescription: 'Five door, Right Hand Drive, Two Wheel drive jeep (GVW min 2500 kg, min 7 persons)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty after acceptance',
      sections: createSectionsFromRows([
        ['General', 'Five door, Right Hand Drive, Two Wheel drive jeep suitable to operate in rough and hilly road condition of Nepal. Gross Vehicle Weight (GVW) shall not be less than 2500 kg and shall have total seating capacity for at least 7 persons including driver.'],
        ['Engine', 'Four stroke, four cylinder, water-cooled diesel engine having engine displacement not less than 2000 cc, developing maximum rated power output not less than 130 bhp and torque not less than 300 Nm at governed RPM.'],
        ['Emission Standard', 'The emission standard of the vehicle shall meet the applicable Nepal Vehicle Mass Emission Standard 2069 certified by Department of Transport Management, Nepal.'],
        ['Gauges', 'To include speedometer, odometer, temperature and fuel gauges etc.'],
        ['Transmission', 'Manual shift at least six forward and one reverse, floor mounted.'],
        ['Turning Radius', 'Not more than 6 m.'],
        ['Ground Clearance', 'Minimum 180 mm.'],
        ['Suspension', 'Double wishbone / telescopic / shock absorber / anti roll bar / stabilizer bar / hydraulic double acting / five link type suspension.'],
        ['Tyres', 'Standard radial size.'],
        ['Steering', 'Power assisted.'],
        ['Brakes', 'Front disc type, rear drum type, hydraulic operated on all wheels and parking brake.'],
        ['Body / Cab', 'Four side doors and one rear door for luggage compartment. All metallic cab with insulated roof, laminated / tinted glass windscreen, front windscreen washers and wipers, comfortable seats, two sun visors, rear view mirror and two side view mirrors.'],
        ['Chassis and Frame', 'Steel, heavy duty suitable for rough road conditions with towing hook.'],
        ['Essential Accessories', 'Head light, tail lamp and rear light, reversing light, turn signals; Cabin lights; Spare wheel with tubeless tyre; Suitable jack with handle; Seat belts for driver and co-passengers; Power windows; Airbag minimum driver & co-passenger; Tilt steering.'],
        ['Instructions', 'All signs and instructions in the vehicle shall be in English.'],
        ['Manuals', "One copy of the Operator's and Owner's instructions manual in English shall be supplied."],
        ['Tools', 'A set of tools for general maintenance shall be supplied.'],
        ['Color', 'Standard.'],
        ['Manufacture Year', 'The manufacture year of the vehicle shall be 2025 or later.'],
        ['Warranty', 'Manufacturer shall provide a minimum of one year warranty after acceptance.']
      ])
    }
  },

  // 4. Four Wheel Drive Vehicle (Hardtop Station Wagon 4x4)
  {
    id: 'std-4wd-004',
    title: 'Four Wheel Drive Vehicle (Hardtop 4x4 Station Wagon)',
    category: 'Four Wheel Drive Vehicle',
    description: 'Heavy duty rugged 4x4 hardtop utility vehicle for municipal fieldwork, inspection and mountain terrain operations.',
    version: '2.5',
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Four Wheel Drive Vehicle',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Four Wheel Drive Vehicle',
      fiscalYear: '2083/84',
      vehicleCategory: 'Four Wheel Drive Vehicle',
      vehicleDescription: '5-Door Hardtop 4WD Turbo Diesel Station Wagon (Right Hand Drive)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum 3 Years or 100,000 km whichever occurs first',
      sections: createSectionsFromRows([
        ['General', 'Brand new, heavy-duty 4-Wheel Drive (4WD) Hardtop Station Wagon, Right Hand Drive (RHD), seating 7 to 9 persons.'],
        ['Engine', '4-stroke, Common Rail Direct Injection (CRDi) Turbocharged Diesel Engine with Intercooler, displacement min 2,400 cc up to 3,000 cc, power not less than 130 HP, torque not less than 350 Nm.'],
        ['Emission Standard', 'Compliant with Euro IV / Bharat Stage VI or Nepal Vehicle Mass Emission Standard 2069.'],
        ['Transmission', 'Manual transmission with min 5 forward speeds and 1 reverse speed, part-time or full-time 4WD transfer case with 2H, 4H, 4L.'],
        ['Ground Clearance', 'Minimum 210 mm under lowest point in unladen condition.'],
        ['Dimensions', 'Wheelbase between 2,700 mm and 3,100 mm; Gross Vehicle Weight (GVW) min 2,600 kg to 3,200 kg.'],
        ['Steering', 'Hydraulic or Electronic Power-assisted steering, tilt/telescopic adjustable.'],
        ['Suspension & Brakes', 'Front independent double wishbone with coil springs; Rear heavy-duty semi-elliptic multi-leaf springs. Front ventilated discs and rear drum/disc with ABS and EBD.'],
        ['Tyres & Wheels', 'All-terrain tubeless radial tyres with full-size spare wheel and mounting bracket.'],
        ['Cab & Air Conditioning', 'High-capacity dual air conditioner with front and rear climate blowers, demister, dual front SRS airbags, and underbody skid plates.'],
        ['Warranty & Documentation', 'Minimum 3 years or 100,000 km warranty, comprehensive toolkit, and operator manual in English.']
      ])
    }
  },

  // 5. School Bus (From Reference Code)
  {
    id: 'std-school-bus-005',
    title: 'School Bus (36 Seater)',
    category: 'School Bus',
    description: 'Right hand drive vehicle suitable for driving in Nepal at altitude 2500m, GVW min 7000 kg, seating capacity at least 36 persons.',
    version: '1.8',
    created_at: '2026-03-05T08:30:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of School Bus',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of School Bus',
      fiscalYear: '2083/84',
      vehicleCategory: 'School Bus',
      vehicleDescription: 'Right hand drive school passenger bus (GVW min 7000 kg, wheelbase min 4100 mm, min 36 seats)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty after acceptance',
      sections: createSectionsFromRows([
        ['General', 'Right hand drive vehicle suitable for driving in Nepal at an altitude of 2500 meter and in ambient temperature -5 to 50 degree Celsius. Gross vehicle weight not less than 7000 kg. Wheelbase minimum 4100 mm and seating capacity for at least 36 persons including driver.'],
        ['Engine', 'Maximum rated output power not less than 120 HP at governed RPM and maximum torque not less than 400 Nm at governed RPM.'],
        ['Emission Standard', 'The emission standard of the vehicle must be in compliance with or superior to the applicable Vehicle Mass Emission Standard.'],
        ['Gauges', 'To include water temperature, fuel, oil pressure and transmission gauge.'],
        ['Transmission', 'Manual shift at least five forward and one reverse.'],
        ['Suspension', 'Semi elliptical leaf spring at front and rear.'],
        ['Tyres', '7.5 X 16-16PR.'],
        ['Steering', 'Power Steering.'],
        ['Brakes', "Dual circuit full air S-Cam brake with manufacturer's fitted ABS."],
        ['Cab', 'All metallic / FRP cab, front wipers, glass windows on door, through ventilation and comfortable seats, rear view mirror and two side view mirrors.'],
        ['Chassis and Frame', 'Steel heavy duty suitable for rough road condition with toe hook.'],
        ['Essential Accessories', 'Head light, tail and rear light, reversing light, turn signals; Cabin lights; Speedometer / odometer; Heavy duty front bumper; One spare wheel; Suitable jack and handle; Seat belt for driver.'],
        ['Instructions', 'All signs and instructions in the vehicle shall be in English.'],
        ['Manuals', "A copy of the Operator and Owner's instruction and maintenance manual in English shall be supplied."],
        ['Tools', 'A set of tools as required for general maintenance shall be provided.'],
        ['Color', 'Standard colour.'],
        ['Warranty', 'Manufacturer shall provide minimum one year of warranty after acceptance.']
      ])
    }
  },

  // 6. Backhoe Loader (From Reference Code)
  {
    id: 'std-backhoe-006',
    title: 'Backhoe Loader',
    category: 'Backhoe Loader',
    description: 'All wheel drive, rigid frame backhoe loader with steel cab, operating weight min 7600 kg, 6-in-1 loader bucket (1 cu.m).',
    version: '2.0',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Backhoe Loader',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Backhoe Loader',
      fiscalYear: '2083/84',
      vehicleCategory: 'Backhoe Loader',
      vehicleDescription: 'All wheel drive, rigid frame backhoe loader with steel cab (manufacture year 2024 or later)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty after acceptance',
      sections: createSectionsFromRows([
        ['General', 'All wheel drive, rigid frame backhoe loader with steel cab, suitable for operation under rough working conditions and adverse climate condition. Wheelbase should not be less than 2100 mm. Manufactured in the year 2024 or later.'],
        ['Capacity', 'Operating weight not less than 7600 kg.'],
        ['Loader', 'General purpose bucket with (6 in 1) bolt on teeth of SAE rated capacity nominally heaped approx. 1 cu.m with shovel break out force not less than 5250 kgf. Dump Height ≥ 2730 mm; Pin Height ≥ 3400 mm.'],
        ['Backhoe', 'Backhoe bucket with bolt on teeth of SAE rated capacity approx. 0.26 cu.m with tear out force 5600 kgf. Minimum working height ≥ 5600 mm; Minimum digging depth ≥ 4600 mm; Minimum digging reach ≥ 5700 mm.'],
        ['Engine', 'Water cooled diesel engine developing SAE rated gross HP not less than 85 HP with minimum 375 Nm torque with displacement of 3.9 liters at governed RPM.'],
        ['Gauges', 'To include ammeter, water temperature, fuel, oil pressure, transmission and hydraulic gauges.'],
        ['Transmission', 'Torque converter with four speed power shift type.'],
        ['Axles', 'Four wheel drive with fixed rear axle and at least 15° oscillating front axles.'],
        ['Tires', 'Suitable four tires with tubes for operating machine in rough road conditions.'],
        ['Steering', 'Power assisted hydrostatic steering.'],
        ['Brakes', 'Hydraulically actuated, wet multiple disc / caliper disc type service brake and separate parking brake.'],
        ['Cab', 'All steel enclosed cab with laminated glass windscreen, insulated roof, suitably located controls, rear view mirror, cabin light, wiper and adjustable cushioned seat.'],
        ['Hydraulics', 'Suitable hydraulic pumps flow not less than 118 LPM @ 2200 rpm and system pressure Bar 205.'],
        ['Essential Accessories', 'Road lights, work lights and fog lights; Cabin lights; Service hour meter.'],
        ['Instructions', 'All signs and instructions in the equipment shall be in English.'],
        ['Manuals', "One copy of the Operator's and Owner's Instructions and Maintenance manual in English. Two copies of following manuals: (a) Spare parts catalogue (b) Comprehensive workshop manual."],
        ['Tools', 'A set of tools as required for general maintenance shall be supplied within a lockable tool box for each unit.'],
        ['Color', 'Orange / Construction equipment yellow.'],
        ['Warranty', 'Manufacturer shall provide a minimum of one year warranty after acceptance.']
      ])
    }
  },

  // 7. Hydraulic Excavator (From Reference Code)
  {
    id: 'std-excavator-007',
    title: 'Hydraulic Excavator',
    category: 'Hydraulic Excavator',
    description: 'Crawler mounted hydraulic excavator, standard boom and arm, operating altitude up to 3000m MSL, operating weight at least 20,000 kg.',
    version: '2.0',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specification of Hydraulic Excavator',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Hydraulic Excavator',
      fiscalYear: '2083/84',
      vehicleCategory: 'Hydraulic Excavator',
      vehicleDescription: 'Crawler mounted hydraulic excavator, 1 cu.m bucket, operating weight at least 20,000 kg',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty after acceptance by the office',
      sections: createSectionsFromRows([
        ['General', 'Crawler mounted hydraulic excavator, with heavy duty standard size boom and arm designed specifically for job on rocky, sandy and hilly sites. Suitable for operation under both common and tough / adverse climatic condition at operating altitude up to 3000 m (MSL).'],
        ['Engine', 'Water-cooled, four stroke, diesel engine, developing gross rated maximum power not less than 150 hp at governed rpm. Turbocharged, after cooled engine with piston displacement of not less than 6500 cc.'],
        ['Hydraulic System', 'Hydraulically operated swing system, travel system and work implement systems equipped with suitable capacity and adequate units of hydraulic cylinder, pumps / motors, reservoir, sensors.'],
        ['Gauges', 'Gauges and or meters as necessary for efficient operation, maintenance and safety.'],
        ['Under Carriage', 'Track type undercarriage, heavy duty with track adjustment, sprocket, track rollers and idlers, sealed and lubricated. Track shoe width at least 600 mm with triple grouser type.'],
        ['Working Range / Performance', 'Maximum cutting height not less than 9200 mm; Maximum digging depth not less than 5900 mm; Maximum digging reach (ground level) not less than 9000 mm.'],
        ['Swing Speed', 'Not less than 10 per minute.'],
        ['Bucket', 'Bucket capacity not less than 1 cu.m.'],
        ['Operating Weight', 'At least 20000 kg.'],
        ['Cab', 'The excavator shall be furnished with a cab focused on safety of the operator, ergonomically designed adjustable operator seat.'],
        ['Essential Accessories', 'Service hour meter; Electric windscreen wipers; Heater and defroster; Working lights; Door locks; Travel alarm.'],
        ['Instructions', 'All signs and instructions in the machine shall be in English.'],
        ['Manuals', "One copy of the Operator's and Owner's Instructions and Maintenance manual, Spare Parts Catalogue and Comprehensive Workshop Manual in English."],
        ['Tools', 'A set of tools as required for general maintenance shall be supplied within a lockable tool box.'],
        ['Warranty', 'Manufacturer shall provide a minimum of one year warranty after acceptance by the office.']
      ])
    }
  },

  // 8. Motorcycle (From Reference Code)
  {
    id: 'std-moto-008',
    title: 'Motorcycle (150cc Fuel Injected)',
    category: 'Motorcycle',
    description: 'Motorcycle of sturdy design, suitable for official field use, FI engine not less than 149cc, disc brakes, tubeless tyres.',
    version: '2.0',
    created_at: '2026-02-10T12:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specification of Motorcycle',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Motorcycle',
      fiscalYear: '2083/84',
      vehicleCategory: 'Motorcycle',
      vehicleDescription: 'Motorcycle of sturdy design, suitable for official field use (manufacture year 2025 or later)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year upon acceptance',
      sections: createSectionsFromRows([
        ['General', 'Motorcycle of sturdy design, suitable for official field use.'],
        ['Engine', 'Fuel injection engine with displacement not less than 149 cc, air cooled, 4-stroke engine, electric starter. Maximum power not less than 9 kW at rated RPM. Maximum torque not less than 13 N.m at rated RPM.'],
        ['Brake and Tyre', 'Front brake: Disc brake. Rear brake: Disc brake. Tubeless tyres.'],
        ['Dimensions and Capacity', 'Ground clearance greater than 160 mm. Seat height, wheelbase and kerb weight suitable for normal field operation.'],
        ['Features', 'Digital meter, LED headlight, suitable suspension system for field use, safety features as provided by the manufacturer.'],
        ['Warranty and Accessories', "Helmets and owner's manual in English. Warranty: minimum one year upon acceptance."],
        ['Proven Performance', 'Manufacture year must be 2025 or later.'],
        ['Delivery', 'Delivered to Office of the Municipal Executive, Pokhara Metropolitan City.']
      ])
    }
  },

  // 9. Scooter (From Reference Code)
  {
    id: 'std-scooter-009',
    title: 'Scooter (125cc Fuel Injected)',
    category: 'Scooter',
    description: 'Scooter of sturdy design, fuel injection (FI) engine with displacement 125 CC ± 3 CC, disc brake, ground clearance not less than 145mm.',
    version: '2.0',
    created_at: '2026-02-12T10:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specification of Scooter',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Scooter',
      fiscalYear: '2083/84',
      vehicleCategory: 'Scooter',
      vehicleDescription: 'Scooter of sturdy design for municipal administrative mobility (manufacture year 2025 or later)',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year upon acceptance (first 4 free services)',
      sections: createSectionsFromRows([
        ['General', 'Scooter of sturdy design.'],
        ['Engine', 'Fuel injection (FI) engine with displacement 125 CC ± 3 CC. Max Power: not less than 8 PS at rated RPM. Max Torque: not less than 9.5 Nm at rated RPM.'],
        ['Brake', 'Front Brake: Disc operated. Rear Brake: Disc / drum operated.'],
        ['Ground Clearance', 'Not less than 145 mm.'],
        ['Warranty and Accessories', "Accessories: Helmet and Owner's manual in English. Warranty: minimum one year upon acceptance. Servicing: minimum first four free services."],
        ['Proven Performance', 'Manufacture year must be 2025 or later.'],
        ['Delivery', 'Delivered to Office of the Municipal Executive, Pokhara Metropolitan City.']
      ])
    }
  },

  // 10. Combine Mill (From Reference Code)
  {
    id: 'std-combine-mill-010',
    title: 'Combine Mill (Paddy & Grain)',
    category: 'Combine Mill',
    description: 'Combined mill for processing paddy to rice (min 150 kg/h) and crushing grains to powder (min 130 kg/h), single phase 220V electric motor.',
    version: '1.2',
    created_at: '2026-03-10T11:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specification of Combined Mill',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Combined Mill',
      fiscalYear: '2083/84',
      vehicleCategory: 'Combine Mill',
      vehicleDescription: 'Electric driven combine mill for small-scale household and cooperative grain processing',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty and one year free servicing after acceptance',
      sections: createSectionsFromRows([
        ['General', 'The combine mill is used by small scale farmers and household users for processing paddy to rice. It must also be able to crush various grains to powder form.'],
        ['Productivity', 'The productivity of the combine mill for milling must not be less than 150 kg/hour and for grain grinding must not be less than 130 kg/hour.'],
        ['Drive', 'Electric drive of rated power not less than 2 KW of motor operating in a single phase electric supply of voltage 220 Volt, 50 Hz.'],
        ['Instructions', 'All signs and instructions on the combine mill shall be in English or Nepali.'],
        ['Manuals', "One copy of the Operator's instructions manual in English or Nepali shall be supplied to each unit of combine mill."],
        ['Warranty', 'Manufacturer shall provide a minimum of one year warranty and one year free servicing after acceptance.']
      ])
    }
  },

  // 11. Mini Tiller (From Reference Code)
  {
    id: 'std-mini-tiller-011',
    title: 'Mini Tiller (Land Preparation)',
    category: 'Mini Tiller',
    description: 'Mini tiller for land preparation in hill and plain areas, 4-stroke engine, tilling width min 700 mm, depth min 150 mm.',
    version: '1.2',
    created_at: '2026-03-10T11:30:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specification of Mini Tiller',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Mini Tiller',
      fiscalYear: '2083/84',
      vehicleCategory: 'Mini Tiller',
      vehicleDescription: '4-stroke powered agricultural mini tiller for slope and plain cultivation',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum one year warranty after acceptance',
      sections: createSectionsFromRows([
        ['General', 'Mini tiller suitable for small scale farmers for land preparation in hill and plain areas.'],
        ['Engine', 'Four stroke, air cooled diesel / petrol engine as specified, developing rated power not less than the specified HP at governed RPM with recoil / electric starting system.'],
        ['Transmission', 'Suitable gear transmission with at least two forward and one reverse speed.'],
        ['Tilling Width / Depth', 'Tilling width not less than 700 mm and tilling depth not less than 150 mm.'],
        ['Fuel Tank', "Fuel tank capacity as per manufacturer's standard specification."],
        ['Instructions', 'All signs and instructions on the machine shall be in English or Nepali.'],
        ['Manuals', "One copy of the Operator's instructions manual in English or Nepali shall be supplied with each unit."],
        ['Warranty', 'Manufacturer shall provide a minimum of one year warranty after acceptance.']
      ])
    }
  },

  // 12. Tipper / Dump Truck
  {
    id: 'std-truck-012',
    title: '10-12 Ton Medium Heavy Tipper / Dump Truck',
    category: 'Truck',
    description: 'Hydraulic tipping dump truck for civil works, road maintenance, aggregate haulage, and municipal construction.',
    version: '2.0',
    created_at: '2026-02-15T09:45:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of 10-12 Ton Tipper Truck',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of 10-12 Ton Tipper Truck',
      fiscalYear: '2083/84',
      vehicleCategory: 'Truck',
      vehicleDescription: '4x2 / 6x4 Heavy Duty Tipper Truck with 8.5 to 10 Cu.M Box Body',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: '2 Years or 100,000 km',
      sections: createSectionsFromRows([
        ['Box Body Capacity', 'Minimum 8.5 to 10.0 cubic meter box type tipping body.'],
        ['Tipping Mechanism', 'Front-end or underbody heavy-duty hydraulic ram cylinder with PTO driven pump.'],
        ['Plate Thickness', 'Floor plate minimum 6 mm high tensile steel; side walls minimum 4 mm steel.'],
        ['Engine Displacement & Power', 'Minimum 3,800 cc to 5,800 cc, minimum 160 HP to 200 HP.'],
        ['GVW (Gross Vehicle Weight)', '16,000 kg to 18,500 kg rating.'],
        ['Rear Axle', 'Heavy duty single reduction or hub reduction rear axle with high load capacity.'],
        ['Braking System', 'Full air dual circuit S-Cam brakes with ABS and spring parking brake.']
      ])
    }
  },

  // 13. Tractor (45-50 HP 4WD)
  {
    id: 'std-tractor-013',
    title: '45-50 HP 4WD Agricultural & Haulage Tractor',
    category: 'Tractor',
    description: 'Versatile 4-wheel drive utility tractor for agricultural support, trolley haulage, and municipal verge clearance.',
    version: '1.5',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of 45-50 HP 4WD Utility Tractor',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of 45-50 HP 4WD Utility Tractor',
      fiscalYear: '2083/84',
      vehicleCategory: 'Tractor',
      vehicleDescription: '45 to 50 HP Four-Wheel Drive Agricultural Utility Tractor with 3-Point Hitch & PTO',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: '2 Years or 2,000 Operating Hours',
      sections: createSectionsFromRows([
        ['Engine Power', '45 to 50 HP @ rated 2,000 - 2,200 RPM, 3 or 4 cylinders, direct injection water-cooled.'],
        ['PTO Shaft', 'Standard 6-spline 540 RPM dual speed / live PTO, minimum 40 PTO HP.'],
        ['Drivetrain', '4-Wheel Drive (4WD) with mechanical front wheel drive engagement and differential lock.'],
        ['Hydraulic Lift Capacity', 'Minimum 1,500 kg to 1,800 kg at lower link hitch points with draft control.'],
        ['3-Point Linkage', 'Category II standard 3-point linkage with adjustable leveling rod and check chains.'],
        ['Brakes', 'Oil-immersed multi-disc brakes with independent left/right pedals and lock.']
      ])
    }
  },

  // 14. Ambulance (Type B Life Support)
  {
    id: 'std-ambulance-014',
    title: 'Type B Emergency Life Support Ambulance',
    category: 'Ambulance',
    description: 'Specialized healthcare emergency transport ambulance with life-support medical compartment and sirens.',
    version: '3.0',
    created_at: '2026-01-10T11:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Type B Emergency Life Support Ambulance',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Type B Emergency Life Support Ambulance',
      fiscalYear: '2083/84',
      vehicleCategory: 'Ambulance',
      vehicleDescription: 'High-Roof 4WD/RWD Medical Transport Ambulance with Patient Compartment',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: 'Minimum 3 Years or 100,000 km on vehicle; 1 Year on medical equipment',
      sections: createSectionsFromRows([
        ['Chassis & Drive', 'Factory-built van or purpose-built ambulance body, High Roof, RHD, 4WD or RWD.'],
        ['Engine', 'Diesel Turbocharged CRDi, minimum 2,200 cc, minimum 110 HP.'],
        ['Patient Cabin Height', 'Minimum interior standing height of 1,600 mm.'],
        ['Main Stretcher', 'Automatic loading roll-in multi-level stretcher with safety locking mechanism and mattress.'],
        ['Oxygen Supply System', 'Piped dual oxygen system with 2x 10L oxygen cylinders, regulators, flowmeters, and humidifier.'],
        ['Medical Suction Unit', 'Electrical suction pump (12V DC / 220V AC) with collection canister.'],
        ['Emergency Lightbar & Siren', 'Roof-mounted LED beacon lightbar (Red & Blue) with 100W multi-tone electronic siren.'],
        ['Dual Battery & Inverter', 'Auxiliary deep-cycle battery with smart isolator and 1,000W pure sine wave inverter (220V sockets).']
      ])
    }
  },

  // 15. Sport Utility Vehicle (SUV)
  {
    id: 'std-suv-015',
    title: 'Sport Utility Vehicle (SUV)',
    category: 'SUV',
    description: 'Executive premium SUV for executive transportation, council dignitary movement, and high-level official tours.',
    version: '2.0',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-11-05T08:00:00Z',
    content: {
      documentTitle: 'Technical Specifications of Sport Utility Vehicle (SUV)',
      organizationName: 'Pokhara Metropolitan City',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of Sport Utility Vehicle (SUV)',
      fiscalYear: '2083/84',
      vehicleCategory: 'SUV',
      vehicleDescription: 'Executive 5/7 Seater Premium Sport Utility Vehicle (SUV) Automatic/Manual',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      warrantyPeriod: '3 Years or 100,000 km',
      sections: createSectionsFromRows([
        ['Body Type', 'Monocoque or ladder-frame premium SUV, 5 doors, Right Hand Drive, minimum 7 Seater with folding 3rd row.'],
        ['Ground Clearance', 'Minimum 200 mm at unladen condition.'],
        ['Engine Type', 'Turbocharged Diesel / Hybrid Petrol Engine compliant with Euro VI / BS VI, between 1,990 cc and 2,500 cc.'],
        ['Transmission & Drivetrain', '6-Speed Automatic / Manual transmission with All-Wheel Drive (AWD) or 4-Wheel Drive.'],
        ['Safety & Electronics', 'Minimum 6 airbags, ABS with EBD, ESP, Hill Start Assist, rearview camera, and touchscreen infotainment.']
      ])
    }
  }
];
