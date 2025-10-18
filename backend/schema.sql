-- SQLite Schema for Legal Document Templating System
-- This file is for reference only - tables are created by SQLAlchemy

-- Templates table
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    template_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    file_description TEXT,
    doc_type TEXT,
    jurisdiction TEXT,
    similarity_tags TEXT, -- JSON array
    body_md TEXT NOT NULL,
    embedding TEXT, -- JSON array of floats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_template_id ON templates(template_id);

-- Template Variables table
CREATE TABLE template_variables (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    example TEXT,
    required INTEGER DEFAULT 0,
    dtype TEXT DEFAULT 'string',
    regex TEXT,
    enum_values TEXT, -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_template_variables_template_id ON template_variables(template_id);

-- Documents table (original uploads)
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime_type TEXT,
    raw_text TEXT,
    file_path TEXT,
    embedding TEXT, -- JSON array of floats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instances table (draft history)
CREATE TABLE instances (
    id TEXT PRIMARY KEY,
    template_id TEXT,
    user_query TEXT NOT NULL,
    answers_json TEXT, -- JSON object
    draft_md TEXT,
    draft_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE INDEX idx_instances_template_id ON instances(template_id);
