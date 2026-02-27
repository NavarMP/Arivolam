-- =====================================================
-- 14_map_editor_rls.sql
-- Allow authenticated users to edit map elements
-- =====================================================

CREATE POLICY "Allow authenticated users to insert buildings"
    ON public.campus_buildings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update buildings"
    ON public.campus_buildings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete buildings"
    ON public.campus_buildings FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert pois"
    ON public.campus_pois FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update pois"
    ON public.campus_pois FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete pois"
    ON public.campus_pois FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert nav nodes"
    ON public.campus_nav_nodes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update nav nodes"
    ON public.campus_nav_nodes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete nav nodes"
    ON public.campus_nav_nodes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert nav edges"
    ON public.campus_nav_edges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update nav edges"
    ON public.campus_nav_edges FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete nav edges"
    ON public.campus_nav_edges FOR DELETE USING (auth.role() = 'authenticated');
