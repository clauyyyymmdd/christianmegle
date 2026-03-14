-- Migration: Add heaven_response column to priests table
-- Run this if you have an existing database

ALTER TABLE priests ADD COLUMN heaven_response TEXT;
