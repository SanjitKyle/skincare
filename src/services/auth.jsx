import { axiosInstance } from "./axiosInstance"

export const register=async(formdata)=>{
    try{
        const res=await axiosInstance.post('/auth/register',formdata);
        console.log('resons',res);
        return res;


    }catch(error)
    {
        throw error;

    }
}

export const login=async(formData)=>{
    try{
        const res=await axiosInstance.post('/auth/login',formData);
        return res;

    }catch(error)
    {
        throw error;
    }
}

export const registerClinic = async (formData) => {
    try {
        const res = await axiosInstance.post('/auth/register-clinic', formData);
        return res;
    } catch (error) {
        throw error;
    }
};
