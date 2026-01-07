import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios';


export const fetchUserRatings = createAsyncThunk('ratings/fetchUserRatings', async ({getToken},thunkAPI )=>{

   try {
     const token = await getToken();
   
      const {data} = await axios.get('/api/rating',
      { headers: { Authorization : `Bearer ${token}` }} )


       console.log("coodf sdf",data)
     
      return data ? data.ratings : [];
    
   } catch (error) {

    return thunkAPI.rejectWithValue(error.response.data)
    
   }

})





const ratingSlice = createSlice({
    name: 'rating',
    initialState: {
        ratings: [],
    },
    reducers: {
        addRating: (state, action) => {
            state.ratings.push(action.payload)
        },
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchUserRatings.fulfilled, (state,action)=>{
            console.log("payload in payload", action.payload)
            state.ratings = action.payload
        })
    }
})

export const { addRating } = ratingSlice.actions

export default ratingSlice.reducer