import {axiosInstance} from './axiosInstance';
export const AddDoctor=async(token,doctorData)=>{
    try{
         const finaldata={
            ... doctorData,
            working_days:doctorData.working_days.split(',').map(day=>day.trim())
        }
        const response=await axiosInstance.post("/doctors",finaldata,{
            headers:{
                authorization:`Bearer ${token}`
            }
        });
        return response.data;
    }catch(error)
    {
        console.error('Error creating doctor:', error);
        throw error;
    }
}
export const getDoctors=async(token)=>{
    try{
        const res=await axiosInstance.get("/doctors",{
            headers:{
                authorization:`Bearer ${token}`
            }
        });
        return res.data
        
    }catch(error)
    {
        throw error

    }
}
