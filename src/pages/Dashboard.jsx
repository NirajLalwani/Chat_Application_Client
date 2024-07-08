import React, { useEffect, useState } from 'react'
import Input from '../components/Input'
import { useNavigate } from 'react-router-dom'
import { useUserContext } from '../context/UserContext'
import { GetMessageRoute, SendMessageRoute, CreateConversationRoute, defaultRoute } from '../utils/routes'
import { io } from 'socket.io-client'

import { LuSend } from "react-icons/lu";
import { HiUserAdd } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { IoMdArrowBack } from "react-icons/io";

const Dashboard = () => {

    const { userData, isLoggedIn, userConversation, filterUsers, messagesData, setMessagesData, setIsLoggedIn, setUserConversations, filteredUser } = useUserContext();
    const navigate = useNavigate();


    useEffect(() => {
        if (!isLoggedIn) {
            navigate('users/sign_in');  //?Navigting to signin page
        }
    }, [isLoggedIn])

    if (!userData || !userConversation) {
        return <h1>Loading.....</h1>  //?Showing Loading userdata and userConversation is not available
    }

    //&For Responsive Design
    const [addNewFriends, setAddNewFriends] = useState(false)
    const [conversationOpen, setConversationOpen] = useState(false)



    const [messageToBeSend, setMessageToBeSend] = useState("");

    //&Socket Io
    const [socket, setSocket] = useState(io("https://chat-application-backend-8jfk.onrender.com"));
    // const [socket, setSocket] = useState(io("http://localhost:8000"));
    const [onlineUsers, setOnlineUsers] = useState([])


    useEffect(() => {
        socket.emit('addUser', userData.userId)
        socket.on('getUsers', (users) => {
            setOnlineUsers(users)
        })

        const handleBeforeUnload = (event) => {
            socket.emit('removeUser', userData.userId);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
    }, [socket, userData.userId])



    useEffect(() => {
        socket.on('getMessage', (data) => {
            setMessageToBeSend("")
            setMessagesData(prev => ({
                ...prev,
                messages: [...prev.messages, data]
            }));

        });

        socket.on('getConversation', (data) => {
            setUserConversations(prev => ([
                ...prev,
                {
                    fullName: data.fullName,
                    email: data.email,
                    image: data.image,
                    ConversationId: data.conversationId,
                    userId: data.userId
                }
            ]
            ));
        });
    }, [socket])


    useEffect(() => {
        socket.on('getLatestMessage', (data) => {
            if (userConversation.length > 0) {
                let allConversation = userConversation
                let index = allConversation.findIndex((curr) => {
                    return curr.ConversationId === data.conversationId;
                })
                if (index !== -1) {
                    allConversation[index].latestMessage = data.message
                    setUserConversations(allConversation);
                }
            }
        })
    }, [socket, userConversation])

    const scrollToBottom = () => {
        const container = document.querySelector('.message-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    useEffect(() => {
        scrollToBottom();
    }, [messagesData])



    const fetchMessages = async (ConversationId, Name, Img, Id, Email) => {
        scrollToBottom();
        const response = await fetch(`${GetMessageRoute}/${ConversationId}`)
        const resData = await response.json();
        setMessagesData({
            ReceiverId: Id,
            ReceiverName: Name,
            ReciverImage: Img,
            messages: resData.Data,
            conversationId: ConversationId,
            ReceiverEmail: Email
        })
        console.log("Fetch Messaage Called")
    }

    const CreateConversation = async () => {
        const res = await fetch(CreateConversationRoute, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                senderId: userData.userId,
                receiverId: messagesData.ReceiverId
            })
        })
        const data = await res.json();
        if (res.status === 200) {
            socket.emit('createConversation', {
                fullName: userData.fullName,
                email: userData.email,
                image: userData.image,
                userId: userData.userId,
                receiverId: messagesData.ReceiverId,
                conversationId: data._id,
            })

            setUserConversations([
                ...userConversation,
                {
                    fullName: messagesData.ReceiverName,
                    email: messagesData.ReceiverEmail,
                    image: messagesData.ReciverImage,
                    ConversationId: data._id,
                    userId: messagesData.ReceiverId
                }]),

                setMessagesData({
                    ...messagesData,
                    conversationId: data._id
                })
        }
        return data._id;
    }


    const sendMessage = async () => {
        scrollToBottom();

        if (messagesData.conversationId === 'new') {
            var NewConversationId = await CreateConversation();
        }

        //?for displaying message to receiver 

        socket.emit('updateLatestMessage', {
            receiverId: messagesData.ReceiverId,
            message: messageToBeSend,
            conversationId: NewConversationId ? NewConversationId : messagesData.conversationId
        })
        socket.emit('sendMessage', {
            senderId: userData.userId,
            receiverId: messagesData.ReceiverId,
            message: messageToBeSend,
            conversationId: NewConversationId ? NewConversationId : messagesData.conversationId
        })

        if (messageToBeSend.trim().length > 0) {

            const response = await fetch(`${SendMessageRoute}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    conversationId: NewConversationId ? NewConversationId : messagesData.conversationId,
                    senderId: userData.userId,
                    message: messageToBeSend,
                    receiverId: messagesData.ReceiverId
                })
            })
            const resData = await response.json();


            const conversationId = (messagesData.conversationId === 'new') ? resData.conversationId : messagesData.conversationId;

            if (messagesData.ConversationId === "new") {
                setUserConversations({
                    ...userConversation,
                    ConversationId: conversationId,
                    email: "",
                    fullName: messagesData.ReceiverName,
                    image: messagesData.ReciverImage,
                    userId: messagesData.receiverId
                })
            }

            let allConversation = userConversation

            let index = allConversation.findIndex((curr) => {
                return curr.ConversationId === conversationId;
            })
            allConversation[index].latestMessage = messageToBeSend
            setUserConversations(allConversation);
        }
    }

    //&User Details Pop up
    const [popUp, setPopUp] = useState(false)

    return (
        <div className='w-screen flex'>
            <div className='w-[25%] h-screen  bg-secondary conversation-section'>
                <div className='flex justify-center items-center my-5 h-[15vh] profile-section'>
                    <img src={userData.image} alt="" className='rounded-full profileImage border-primary border-2' />
                    <div className='ml-3'>
                        <h3 className='text-xl font-semibold accountName'>{userData.fullName}</h3>
                        <p className='text-sm font-light'>My Account <span className='text-primary underline text-sm cursor-pointer' onClick={() => {
                            socket.emit('removeUser', userData.userId)
                            localStorage.removeItem('token')
                            setIsLoggedIn(false)
                            navigate('users/sign_in')

                        }}>Logout</span> </p>
                    </div>
                </div>
                <hr />
                <div className='pt-5 shadow-inner'>
                    <div className='text-primary text-xl ml-6'>Messages</div>
                    <div className='overflow-y-scroll h-[67vh] px-6 mt-3 no-scrollbar vh60'>
                        {
                            userConversation.length > 0 ?
                                userConversation.map(({ fullName, image, ConversationId, userId, status = 'online', email, latestMessage }, index) => {
                                    return <>
                                        <div className={`px-3 flex items-center py-2  border-b border-bottom-gray-680 border-[5x] cursor-pointer ${userId === messagesData.ReceiverId ? "bg-[#cdecfba8]" : ""} hover:bg-[#cdecfba8]`} key={index} onClick={() => {
                                            fetchMessages(ConversationId, fullName, image, userId, email)
                                            setConversationOpen(true)
                                        }
                                        }
                                        >
                                            <div className='w-[70px] flex justify-center items-center'>
                                                <img src={image} alt="" className='conversationImage rounded-full  border-primary border-2' />
                                            </div>
                                            <div className='ml-3 w-[100%]'>
                                                <h3 className='text-lg font-semibold w-[100%] break-words conversationName'>{fullName}</h3>
                                                <p className='text-[12px] font-light w-[100%] break-words conversationEmail'>{latestMessage}</p>
                                            </div>
                                        </div>
                                    </>
                                }) :
                                <h3 className='mt-20 text-center'>No Conversation</h3>
                        }
                    </div>
                </div>
                <div className='conversation-section-addUserIcon bg-primary text-xl p-2 rounded-full text-white cursor-pointer' onClick={() => {
                    addNewFriends ?
                        setAddNewFriends(false)
                        :
                        setAddNewFriends(true)
                }}>
                    <HiUserAdd />
                </div>
            </div>

            <div className={`w-[50%] h-screen  bg-white flex flex-col items-center chat-section ${conversationOpen && 'openConversation'}`}>
                {

                    messagesData.ReceiverName ?
                        <>
                            <div className='w-[80%] px-8 bg-secondary h-[60px] mt-6 rounded-full flex justify-start items-center gap-3 p-9 mb-3'>
                                <IoMdArrowBack className='text-xl cursor-pointer' onClick={() => { setConversationOpen(false) }} />
                                <figure>
                                    <img src={messagesData.ReciverImage} alt="" className='conversationImage rounded-full  border-primary border-2 cursor-pointer' onClick={() => {
                                        setPopUp(true)
                                    }} />
                                </figure>
                                <div>
                                    <h3 className='text-sm font-bold'>{messagesData.ReceiverName}</h3>
                                    <p className='text-[12px] font-light'>
                                        {
                                            onlineUsers.find(curr => curr.userId === messagesData.ReceiverId) ? "Online" : "Offline"
                                        }
                                    </p>
                                </div>

                            </div>
                            <div className=' h-[75vh] vh70 w-full overflow-y-scroll style-scrollbar border border-bottom-black message-container'>
                                {
                                    messagesData.messages.length > 0 ? (


                                        <div className='px-8 py-10 flex flex-col gap-5'>

                                            {
                                                messagesData.messages.map(({ senderId, message }, index) => (
                                                    (senderId == userData.userId) ? (
                                                        <div key={index} className='p-3 max-w-[52%] border bg-primary rounded-b-xl rounded-tl-xl text-sm ml-auto text-white message'
                                                            style={{ wordWrap: 'break-word' }}
                                                        >{message}</div>
                                                    ) : (
                                                        <div key={index} className='p-3  max-w-[52%]  bg-secondary rounded-b-xl rounded-tr-xl text-sm mr-auto message'
                                                            style={{ wordWrap: 'break-word' }}
                                                        >{message}</div>
                                                    )
                                                )
                                                )
                                            }

                                        </div>
                                    ) : (

                                        <div>
                                            <h3 className='text-center my-[20vh]'>No Messages</h3>
                                        </div>
                                    )
                                }
                            </div>
                            <div className="w-full px-4 flex  gap-1">
                                <Input placeholder='Type Your Message...' name='text' type='text' className='shadow-xl my-3 focus:outline-none focus:border-[secondary] width-[90%] sendMessage' value={messageToBeSend}
                                    onChange={(e) => {
                                        setMessageToBeSend(e.target.value)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <div className='flex justify-center items-center' onClick={() => {
                                    sendMessage();
                                }}>
                                    <LuSend className='bg-primary p-3 rounded-lg box-content text-white cursor-pointer ' />
                                </div>

                            </div>
                        </> :
                        <h3 className='text-center my-[50vh] translate-y-[-50%] font-semibold'>No Conversation is Selected</h3>
                }
            </div>

            <div className={`w-[25%] h-screen bg-secondary addNewUserSection ${addNewFriends && "openNewFriends"}`}>
                <div>
                    <div className='flex'>
                        <p className='text-primary px-6 py-8 text-xl'>Other Users</p>
                        <div className="close-newUsers ml-auto  text-white" onClick={() => { setAddNewFriends(false) }}>
                            <IoMdClose className='bg-red-600 text-xl rounded-full cursor-pointer' />
                        </div>
                    </div>
                </div>
                <div className='overflow-y-scroll h-[67vh] px-6  no-scrollbar '>
                    {
                        (filterUsers && filterUsers.length > 0) && filterUsers.map(({ fullName, image, _id, email }, index) => {
                            return <>
                                {
                                    _id !== userData.userId &&
                                    <div className={`px-3 flex items-center py-3  border-b border-bottom-gray-680 cursor-pointer hover:bg-[#cdecfba8]`} key={index} onClick={() => {
                                        setMessagesData({
                                            ReceiverId: _id,
                                            ReceiverName: fullName,
                                            ReciverImage: image,
                                            messages: [],
                                            conversationId: 'new',
                                            ReceiverEmail: email

                                        })
                                        setAddNewFriends(false)
                                        setConversationOpen(true)
                                    }}>
                                        <img src={image} alt="" className='rounded-full conversationImage  border-primary border-2' />
                                        <div className='ml-3'>
                                            <h3 className='text-lg font-semibold'>{fullName}</h3>
                                            <p className='text-[12px] font-light'>{email}</p>
                                        </div>
                                    </div >
                                }
                            </>
                        })
                    }
                </div>

            </div>

            {
                popUp && <div className=' h-[100vh] w-[100vw] bg-[#00000074] absolute top-0 left-0 popupDetails'>

                    <div className='center h-[320px] w-[300px]  flex-col gap-2 bg-white rounded-lg flex justify-center items-center shadow-lg shadow-white relative'>
                        <figure className='rounded-full flex justify-center items-center'>
                            <img src={messagesData.ReciverImage} alt="Image" className='rounded-full popupImage' />
                        </figure>
                        <div className='text-center'>
                            <h4 className='text-xl font-semibold'>{messagesData.ReceiverName}</h4>
                            <p className='text-sm font-light'>{messagesData.ReceiverEmail}</p>
                        </div>
                        <IoMdClose className='absolute top-5 right-5 text-2xl border rounded-full p-1 cursor-pointer' onClick={() => { setPopUp(false) }} />
                    </div>
                </div>
            }

        </div >
    )
}

export default Dashboard   