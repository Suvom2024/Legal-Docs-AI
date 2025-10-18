# Sample Outputs - Legal Document Templating System

This document shows example outputs from the system to demonstrate that all features are working correctly.

---

## Example 1: Motor Accident Insurance Notice

### 1. Rendered Markdown Draft

```markdown
# NOTICE TO INSURER

**Date:** Wed, 10 Dec 2025

**To,**
Suvom Kumar Singh
Java, 123 Insurance Plaza
Andheri East Mumbai, Maharashtra - 400069

**Policy Number:** 46545464
**Policy Holder:** Rajesh Sahu
**Vehicle Registration:** 465-ABC

**Subject:** Notice of Motor Vehicle Accident and Insurance Claim

---

Dear Sir/Madam,

I, Rajesh Sahu, the policy holder of the above-mentioned motor insurance policy, hereby give you notice of an accident involving my vehicle on July 10, 2025, at approximately 4:50 AM at the intersection of MG Road and Brigade Road, Bangalore, Karnataka.

## DETAILS OF THE ACCIDENT:

The accident occurred when another vehicle (Registration No: ABSD-6456) driven by Mr. ROHIT PAL failed to stop at the red signal and collided with my vehicle from the right side. The impact caused significant damage to the front right door, bumper, and headlight assembly of my vehicle.

## POLICE REPORT:

An FIR has been filed at the PATULI (FIR No: 45456 dated July 25, 2025). A copy of the FIR is enclosed herewith for your reference.

## EXTENT OF DAMAGE:

The preliminary assessment indicates damage to:
- Front right door (severely dented)
- Front bumper (cracked)
- Right headlight assembly (broken)
- Right side mirror (damaged)

The estimated repair cost is approximately INR 100,000 (Rupees One Lakh Only).

## CLAIM REQUEST:

I hereby request you to process my insurance claim for the damages sustained in the above-mentioned accident. I am willing to provide any additional information or documentation that may be required for processing this claim.

Please acknowledge receipt of this notice and advise me on the further procedure for claim settlement.

Yours faithfully,

**Rajesh Sahu**
Contact: 08777061431
Email: liamelzer44@gmail.com
Address: M-311, Baishnabghata Patuli Township, Kolkata
```

### 2. Saved Template File (with Front-Matter)

```yaml
---
template_id: tpl_motor_accident
title: Notice to Insurer - Motor Accident
file_description: Insurance notice for motor vehicle accident claims in India
jurisdiction: IN
doc_type: Notice to Insurer
similarity_tags:
  - insurance
  - notice
  - india
  - motor
  - accident
  - claim
variables:
  - key: policyholder_name
    label: Policyholder's Full Name
    description: Full name of the person who holds the insurance policy
    example: "Rajesh Sahu"
    required: true
    dtype: string
  
  - key: accident_date
    label: Date of Accident
    description: Date when the accident occurred (ISO 8601 format)
    example: "2025-07-10"
    required: true
    dtype: date
  
  - key: insurance_company
    label: Insurance Company Name
    description: Name of the insurance company as per policy
    example: "XYZ Insurance Ltd"
    required: true
    dtype: string
  
  - key: policy_number
    label: Policy Number
    description: Insurance policy reference number
    example: "46545464"
    required: true
    dtype: string
  
  - key: vehicle_registration
    label: Vehicle Registration Number
    description: Registration plate number of the insured vehicle
    example: "465-ABC"
    required: true
    dtype: string
  
  - key: estimated_damage_amount
    label: Estimated Damage Amount (INR)
    description: Total estimated repair cost in Indian Rupees
    example: "100000"
    required: false
    dtype: integer
    regex: "^\\d+$"
---

# NOTICE TO INSURER

**Date:** {{accident_date}}

**To,**
{{insurance_company}}

**Policy Number:** {{policy_number}}
**Policy Holder:** {{policyholder_name}}
**Vehicle Registration:** {{vehicle_registration}}

**Subject:** Notice of Motor Vehicle Accident and Insurance Claim

---

Dear Sir/Madam,

I, {{policyholder_name}}, the policy holder of the above-mentioned motor insurance policy, hereby give you notice of an accident involving my vehicle on {{accident_date}}, at approximately 4:50 AM at the intersection of MG Road and Brigade Road, Bangalore, Karnataka.

## DETAILS OF THE ACCIDENT:

The accident occurred when another vehicle failed to stop at the red signal and collided with my vehicle from the right side.

## EXTENT OF DAMAGE:

The preliminary assessment indicates damage to:
- Front right door (severely dented)
- Front bumper (cracked)
- Right headlight assembly (broken)
- Right side mirror (damaged)

The estimated repair cost is approximately INR {{estimated_damage_amount}} (Rupees Only).

## CLAIM REQUEST:

I hereby request you to process my insurance claim for the damages sustained in the above-mentioned accident. I am willing to provide any additional information or documentation that may be required for processing this claim.

Please acknowledge receipt of this notice and advise me on the further procedure for claim settlement.

Yours faithfully,

**{{policyholder_name}}**
```

### 3. Template Variables Export (JSON)

```json
{
  "template_id": "tpl_motor_accident",
  "template_title": "Notice to Insurer - Motor Accident",
  "total_variables": 6,
  "variables": [
    {
      "key": "policyholder_name",
      "label": "Policyholder's Full Name",
      "description": "Full name of the person who holds the insurance policy",
      "example": "Rajesh Sahu",
      "required": true,
      "dtype": "string",
      "regex": null,
      "enum_values": null
    },
    {
      "key": "accident_date",
      "label": "Date of Accident",
      "description": "Date when the accident occurred (ISO 8601 format)",
      "example": "2025-07-10",
      "required": true,
      "dtype": "date",
      "regex": "^\\d{4}-\\d{2}-\\d{2}$",
      "enum_values": null
    },
    {
      "key": "insurance_company",
      "label": "Insurance Company Name",
      "description": "Name of the insurance company as per policy",
      "example": "XYZ Insurance Ltd",
      "required": true,
      "dtype": "string",
      "regex": null,
      "enum_values": null
    },
    {
      "key": "policy_number",
      "label": "Policy Number",
      "description": "Insurance policy reference number",
      "example": "46545464",
      "required": true,
      "dtype": "string",
      "regex": null,
      "enum_values": null
    },
    {
      "key": "vehicle_registration",
      "label": "Vehicle Registration Number",
      "description": "Registration plate number of the insured vehicle",
      "example": "465-ABC",
      "required": true,
      "dtype": "string",
      "regex": null,
      "enum_values": null
    },
    {
      "key": "estimated_damage_amount",
      "label": "Estimated Damage Amount (INR)",
      "description": "Total estimated repair cost in Indian Rupees",
      "example": "100000",
      "required": false,
      "dtype": "integer",
      "regex": "^\\d+$",
      "enum_values": null
    }
  ]
}
```

### 4. Template Variables Export (CSV)

```csv
key,label,description,example,required,dtype,regex,enum_values
policyholder_name,Policyholder's Full Name,Full name of the person who holds the insurance policy,Rajesh Sahu,true,string,,
accident_date,Date of Accident,Date when the accident occurred (ISO 8601 format),2025-07-10,true,date,^\d{4}-\d{2}-\d{2}$,
insurance_company,Insurance Company Name,Name of the insurance company as per policy,XYZ Insurance Ltd,true,string,,
policy_number,Policy Number,Insurance policy reference number,46545464,true,string,,
vehicle_registration,Vehicle Registration Number,Registration plate number of the insured vehicle,465-ABC,true,string,,
estimated_damage_amount,Estimated Damage Amount (INR),Total estimated repair cost in Indian Rupees,100000,false,integer,^\d+$,
```

---

## Example 2: Non-Disclosure Agreement (Web Bootstrap)

This template was automatically created from web content using the Exa.ai integration when no local template matched.

### Template Details:
- **Template ID:** tpl_nondisclosure_agreement
- **Source:** Web-extracted from https://jotform.com/pdf-templates/non-disclosure-agreement-template/
- **Process:** Automatic placeholder conversion from blanks to `{{variables}}`
- **Variables Extracted:** 6 main variables + auto-tagged

### Generated Draft Preview:
```
# Non Disclosure Agreement

This Non Disclosure and Confidentiality Agreement ("Agreement") is entered into by and between **Abc CORP**, hereinafter known as the "Disclosing Party" located at **1243 main street**, and **XYZ Ltd**, hereinafter known as the "Receiving Party", located at **466 Oak Avenue** and collectively both parties known as "Parties".

WHEREAS, the Parties now wish to set forth the terms and conditions of non-disclosure commitments via this Agreement;

## Purpose

The Receiving Party undertakes that he shall make use of the Confidential Information solely for the purpose of **evaluating a potential business transaction**.

The information under this agreement to be declared or constituted as Confidential by the Disclosing Party, regardless of whether such information was provided before or after the date of this Agreement shall be, but not limited to the following:

[... continues with filled variables ...]

**Disclosure Period:** **30** days

Yours faithfully,
```

---

## Testing Checklist

Use these samples to verify:

- ✅ Markdown rendering quality
- ✅ Variable placeholder format (`{{variable}}`)
- ✅ YAML front-matter compliance
- ✅ Variable metadata completeness
- ✅ JSON export format
- ✅ CSV export format
- ✅ Template tag generation
- ✅ Web bootstrap capability
- ✅ Confidence scoring
- ✅ Alternative template suggestions

---

**Tracking Code:** UOIONHHC
