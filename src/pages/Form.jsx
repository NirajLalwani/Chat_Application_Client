import React, { useState, useEffect } from 'react'
import Input from '../components/Input'
import Button from '../components/Button'
import { Link, useNavigate } from 'react-router-dom'
import { registerRoute, loginRoute } from '../utils/routes'
import validator from 'validator';
import { useUserContext } from '../context/UserContext'
import { ToastContainer, toast } from 'react-toastify'
const Form = ({
    isSignInPage = true
}) => {

    const navigate = useNavigate();

    const { isLoggedIn, AuthorizeUser } = useUserContext()

    const [data, setData] = useState({
        ...(!isSignInPage && {
            fullName: "",
            image: ""
        }),
        email: "",
        password: ""
    })

    useEffect(() => {
        if (isLoggedIn) { navigate('/') }
        setData({
            ...(!isSignInPage && {
                fullName: "",
                image: ""
            }),
            email: "",
            password: ""
        })
    }, [isSignInPage, isLoggedIn])


    const validateData = () => {
        if (!isSignInPage) {
            if (data.fullName.trim().length === 0) {
                toast.error("Name is Required")
                return false
            } else if ((data.fullName).trim().length < 3) {
                toast.error("Name Must Contain 3 characters");
                return false
            }

        } else if (!validator.isEmail(data.email)) {
            toast.error("Enter a Valid Email")
            return false
        } else if (data.password.length < 8) {
            toast.error("Password must contain 8 characters");
            return false
        }
        return true
    }

    const HandleSubmit = async (e) => {
        const isValidData = validateData();
        if (data.image !== '') {

            const Data = new FormData();
            Data.append("file", data.image)
            Data.append("upload_preset", "Chat-App");
            Data.append("cloud-name", "dwxgjvnhc");
            const res = await fetch("https://api.cloudinary.com/v1_1/dwxgjvnhc/image/upload", {
                method: 'POST',
                body: Data
            })
            var resData = await res.json();
        }
        if (isValidData) {

            if (!isSignInPage) {
                const response = await fetch(registerRoute, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...data, image: data.image !== "" ? resData.url : "https://tse2.mm.bing.net/th?id=OIP.7tlP1ph61ompULJdycVJlQHaHa&pid=Api&P=0&h=180"
                    })
                })
                const responseData = await response.json();
                if (response.status === 200) {
                    toast.success(responseData.message)
                    navigate('/users/sign_in')
                } else {
                    toast.error(responseData.message)
                }
            } else {
                const response = await fetch(loginRoute, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                const responseData = await response.json();
                if (response.status === 200) {
                    toast.success(responseData.message)
                } else {
                    toast.error(responseData.message)
                }
                localStorage.setItem("token", responseData.token);

                if (responseData.token) {
                    await AuthorizeUser(responseData.token);

                    navigate('/')
                }
            }
        }
    }

    return (
        <>
            <div className='bg-white w-[400px]  shadow-xl border rounded-lg flex flex-col justify-center items-center py-6  px-8 center box-content formWidth' >
                <div className='text-3xl font-extrabold'>
                    Welcome {isSignInPage && "Back"}
                </div>

                <div className='text-xl font-light'>
                    {isSignInPage ? "Sign in now to get explored" : "Sign up now to get started"}
                </div>

                <form className='w-full my-4'>
                    {
                        !isSignInPage &&
                        <Input
                            type='text'
                            label='Full name'
                            name='name'
                            placeholder='Enter Your Name'
                            isRequired={true}
                            value={data.fullName}
                            onChange={(e) => setData({ ...data, fullName: e.target.value })}
                        />
                    }
                    <Input
                        type='email'
                        label='Email address'
                        name='email'
                        placeholder='Enter Your Email'
                        isRequired={true}
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                    />
                    <Input
                        type='password'
                        label='Password'
                        name='password'
                        placeholder='Enter Your Password'
                        isRequired={true}
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                    />
                    {
                        (!isSignInPage && data.image === '') &&
                        <Input
                            type='file'
                            label='Profile Picture'
                            onChange={(e) => {
                                setData({ ...data, image: e.target.files[0] })
                            }
                            }
                        />
                    }

                    {(!isSignInPage && data.image !== '') && <h2>File Selected</h2>}



                    <div onClick={(e) => HandleSubmit()} >
                        <Button label={isSignInPage ? "Sign in" : "Sing up"} className='mt-3 mb-2' />
                    </div>
                    <div >
                        {isSignInPage ? "Don't" : "Already"} have an account ? <Link

                            className='text-primary cursor-pointer underline'
                            to={isSignInPage ? "/users/sign_up" : "/users/sign_in"}
                        >
                            {!isSignInPage ? "Sign in" : "Sign up"}

                        </Link>
                    </div>
                </form>
            </div >
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <ToastContainer />
        </>
    )
}

export default Form
