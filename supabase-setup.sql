-- Virtual Try-On App Supabase Setup Script

-- Create the tryon_results table
CREATE TABLE IF NOT EXISTS tryon_results (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    original_image_url TEXT,
    result_image_url TEXT,
    outfit_name TEXT,
    outfit_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tryon_results_task_id ON tryon_results(task_id);
CREATE INDEX IF NOT EXISTS idx_tryon_results_status ON tryon_results(status);
CREATE INDEX IF NOT EXISTS idx_tryon_results_created_at ON tryon_results(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_tryon_results_updated_at 
    BEFORE UPDATE ON tryon_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tryon_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can modify this based on your needs)
CREATE POLICY "Allow all operations on tryon_results" ON tryon_results
    FOR ALL USING (true);

-- Create storage bucket for images
-- Note: This needs to be done through the Supabase dashboard or API
-- The bucket should be named 'tryon-images-2' with public access

-- Grant necessary permissions
GRANT ALL ON TABLE tryon_results TO authenticated;
GRANT ALL ON TABLE tryon_results TO anon;
GRANT USAGE, SELECT ON SEQUENCE tryon_results_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tryon_results_id_seq TO anon;

-- Create a view for recent results
CREATE OR REPLACE VIEW recent_tryon_results AS
SELECT 
    id,
    task_id,
    outfit_name,
    status,
    created_at,
    CASE 
        WHEN status = 'COMPLETED' THEN '✅'
        WHEN status = 'PROCESSING' THEN '⏳'
        WHEN status = 'FAILED' THEN '❌'
        ELSE '⏸️'
    END as status_icon
FROM tryon_results
ORDER BY created_at DESC
LIMIT 50;

-- Grant access to the view
GRANT SELECT ON recent_tryon_results TO authenticated;
GRANT SELECT ON recent_tryon_results TO anon;

-- Insert sample data (optional - for testing)
-- INSERT INTO tryon_results (task_id, outfit_name, outfit_id, status) VALUES
--     ('sample_task_1', 'Casual T-Shirt', 'm1', 'COMPLETED'),
--     ('sample_task_2', 'Formal Shirt', 'm2', 'PROCESSING'),
--     ('sample_task_3', 'Dress', 'f3', 'FAILED');

COMMENT ON TABLE tryon_results IS 'Stores virtual try-on results and metadata';
COMMENT ON COLUMN tryon_results.task_id IS 'FitRoom API task identifier';
COMMENT ON COLUMN tryon_results.original_image_url IS 'URL to the original uploaded image';
COMMENT ON COLUMN tryon_results.result_image_url IS 'URL to the processed try-on result';
COMMENT ON COLUMN tryon_results.outfit_name IS 'Name of the selected outfit';
COMMENT ON COLUMN tryon_results.outfit_id IS 'Identifier of the selected outfit';
COMMENT ON COLUMN tryon_results.status IS 'Current status: PENDING, PROCESSING, COMPLETED, FAILED';
COMMENT ON COLUMN tryon_results.error_message IS 'Error message if the try-on failed'; 