import connectDB from '@/app/lib/mongoose';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('deliveryareas');

    const result = {
      steps: [],
      success: false
    };

    // Get existing indexes
    const indexes = await collection.indexes();
    result.steps.push({
      step: 'Current indexes',
      data: indexes
    });

    // Check if unique index exists
    const hasUniqueIndex = indexes.some(idx => 
      idx.name === 'name_1_branch_1' && idx.unique === true
    );

    if (hasUniqueIndex) {
      // Drop the unique compound index
      try {
        await collection.dropIndex('name_1_branch_1');
        result.steps.push({
          step: 'Dropped unique index',
          status: 'success'
        });
      } catch (error) {
        result.steps.push({
          step: 'Drop unique index',
          status: 'error',
          error: error.message
        });
      }

      // Create new non-unique index
      try {
        await collection.createIndex({ name: 1, branch: 1 });
        result.steps.push({
          step: 'Created non-unique index',
          status: 'success'
        });
      } catch (error) {
        result.steps.push({
          step: 'Create non-unique index',
          status: 'error',
          error: error.message
        });
      }
    } else {
      result.steps.push({
        step: 'Check unique index',
        status: 'skipped',
        message: 'Unique index does not exist or already migrated'
      });
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    result.steps.push({
      step: 'Final indexes',
      data: finalIndexes
    });

    result.success = true;
    result.message = 'Migration completed successfully! You can now add the same delivery area name for different branches.';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}
