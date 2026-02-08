-- Create the tryon_results table for storing FitRoom try-on results
CREATE TABLE IF NOT EXISTS tryon_results (
  id SERIAL PRIMARY KEY,
  task_id TEXT,
  original_image_url TEXT,
  result_image_url TEXT,
  outfit_name TEXT,
  model_name TEXT,
  cloth_type TEXT,
  fitroom_url TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tryon_results_task_id ON tryon_results(task_id);
CREATE INDEX IF NOT EXISTS idx_tryon_results_created_at ON tryon_results(created_at);
CREATE INDEX IF NOT EXISTS idx_tryon_results_status ON tryon_results(status);

-- Enable Row Level Security (RLS) - you can disable this if you want public access
ALTER TABLE tryon_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
-- In production, you should create more restrictive policies
CREATE POLICY "Allow all operations on tryon_results" ON tryon_results
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON tryon_results TO authenticated;
GRANT ALL ON tryon_results TO anon;
GRANT USAGE, SELECT ON SEQUENCE tryon_results_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tryon_results_id_seq TO anon; 