#!/usr/bin/env python3
"""
Export sample outputs from saved templates
Generates:
1. Template with front-matter (template_id.md)
2. Variables metadata (JSON)
3. Variables metadata (CSV)
"""

import json
import csv
import os
from pathlib import Path
import yaml
from database import SessionLocal, Template, TemplateVariable

def export_templates_to_markdown():
    """Export all templates with front-matter to markdown files"""
    
    db = SessionLocal()
    templates = db.query(Template).all()
    
    if not templates:
        print("❌ No templates found in database. Upload and save a template first!")
        return
    
    output_dir = Path("../sample_outputs")
    output_dir.mkdir(exist_ok=True)
    
    for template in templates:
        # Get variables for this template
        variables = db.query(TemplateVariable).filter(
            TemplateVariable.template_id == template.id
        ).all()
        
        # Build front-matter (YAML)
        front_matter = {
            "template_id": template.template_id,
            "title": template.title,
            "file_description": template.file_description,
            "jurisdiction": template.jurisdiction,
            "doc_type": template.doc_type,
            "similarity_tags": template.similarity_tags or [],
            "variables": [
                {
                    "key": v.key,
                    "label": v.label,
                    "description": v.description,
                    "example": v.example,
                    "required": v.required,
                    "dtype": v.dtype,
                    "regex": v.regex
                }
                for v in variables
            ]
        }
        
        # Create markdown file with front-matter
        safe_name = template.title.replace(" ", "_").replace("/", "-")
        md_file = output_dir / f"{safe_name}_TEMPLATE.md"
        
        with open(md_file, 'w') as f:
            f.write("---\n")
            f.write(yaml.dump(front_matter, default_flow_style=False, sort_keys=False))
            f.write("---\n\n")
            f.write(template.body_md)
        
        print(f"✅ Exported: {md_file}")
        
        # Export variables to JSON
        json_file = output_dir / f"{safe_name}_VARIABLES.json"
        variables_json = {
            "template_id": template.template_id,
            "template_title": template.title,
            "total_variables": len(variables),
            "variables": [
                {
                    "key": v.key,
                    "label": v.label,
                    "description": v.description,
                    "example": v.example,
                    "required": v.required,
                    "dtype": v.dtype,
                    "regex": v.regex,
                    "enum_values": v.enum_values
                }
                for v in variables
            ]
        }
        
        with open(json_file, 'w') as f:
            json.dump(variables_json, f, indent=2)
        
        print(f"✅ Exported: {json_file}")
        
        # Export variables to CSV
        csv_file = output_dir / f"{safe_name}_VARIABLES.csv"
        
        with open(csv_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                "key", "label", "description", "example", "required", "dtype", "regex", "enum_values"
            ])
            writer.writeheader()
            for v in variables:
                writer.writerow({
                    "key": v.key,
                    "label": v.label,
                    "description": v.description,
                    "example": v.example,
                    "required": v.required,
                    "dtype": v.dtype,
                    "regex": v.regex or "",
                    "enum_values": json.dumps(v.enum_values) if v.enum_values else ""
                })
        
        print(f"✅ Exported: {csv_file}")
    
    db.close()
    print(f"\n✅ All files exported to: {output_dir.absolute()}")

if __name__ == "__main__":
    print("📁 Exporting templates with front-matter and variables...")
    print("-" * 60)
    export_templates_to_markdown()
    print("-" * 60)
    print("✅ Done!")
