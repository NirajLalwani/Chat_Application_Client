import React, { useEffect, useState } from 'react'

import Input from '../components/Input'
import { ToastContainer, toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useUserContext } from '../context/UserContext'

import { GetMessageRoute, SendMessageRoute, CreateConversationRoute, ClearChatRoute, DeleteChatRoute, DeleteMessageRoute, DeleteAccoutRoute, UpdateThemeRoute, LiveMessageRoute } from '../utils/routes'
import { io } from 'socket.io-client'

//*For React-Icons
import { LuSend } from "react-icons/lu";
import { HiUserAdd } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { IoMdArrowBack } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import { MdOutlineLogout } from "react-icons/md";
const Dashboard = () => {

    const { userData, isLoggedIn, userConversation, filterUsers, messagesData, setMessagesData, setIsLoggedIn, setUserConversations, filter, setUserData, setFilterConversation } = useUserContext();
    const navigate = useNavigate();

    //&Navigate User To Login Page if it is not login
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('users/sign_in');  //?Navigting to signin page
        }
    }, [isLoggedIn])

    //&If data is not Fetched showing loading...
    if (!userData || !userConversation) {
        return <h1>Loading.....</h1>  //?Showing Loading userdata and userConversation is not available
    }

    //&Search User
    const [searchUser, setSearchUser] = useState("");
    const [FinalFilteredUser, setFinalFilteredUser] = useState(filterUsers)

    useEffect(() => {
        setFinalFilteredUser(filterUsers)
    }, [filterUsers])

    //&Message section more options
    const [showMoreOptions, setShowMoreOptions] = useState(false)

    //&Reciver Details Pop up
    const [popUp, setPopUp] = useState(false)

    //&Settings Pop up
    const [showSettings, setShowSettings] = useState(false)

    //&For Responsive Design
    const [addNewFriends, setAddNewFriends] = useState(false)
    const [conversationOpen, setConversationOpen] = useState(false)


    //&Current Message
    const [messageToBeSend, setMessageToBeSend] = useState("");

    //&DoubleClickMessageDeleteCopy
    const [showDoubleClickPopUp, setShowDoubleClickPopUp] = useState(false)

    //&Details of Message which user double clicked
    const [messageDetails, setMessageDetails] = useState({
        senderId: "",
        receiverId: "",
        messageId: "",
        message: "",
        showDelete: false
    })

    //&Socket io for real time communition
    //******************************************************************************************************************************  */
    //&Socket Io
    // const [socket, setSocket] = useState(io("https://chat-application-backend-8jfk.onrender.com"));
    const [socket, setSocket] = useState(io("https://chat-application-backend-8jfk.onrender.com"));
    // const [socket, setSocket] = useState(io("http://localhost:8000"));
    const [onlineUsers, setOnlineUsers] = useState([])

    //?For addUser and getUser in socket and setting all user which are online to onlineUsers state
    useEffect(() => {
        socket.emit('addUser', userData.userId)

        socket.on('getUsers', (users) => {
            setOnlineUsers(users)
        })

        const handleBeforeUnload = (event) => {
            socket.emit('removeUser', userData.userId);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
    }, [socket, userData])


    //?For getting Messages/getConversation/clearChat
    useEffect(() => {

        socket.on('getMessage', (data) => {
            setMessagesData(prev => ({
                ...prev,
                messages: [...prev.messages, data],
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

        socket.on('getClearedChat', (data) => {
            setMessagesData(prev => ({
                ...prev,
                messages: []
            }))
        })


        socket.on('getMessagessAfterDeleting', (data) => {
            setMessagesData(prev => ({
                ...prev,
                messages: data
            }))
        })


    }, [socket])


    //?For Getting Latest Messages
    useEffect(() => {
        socket.on('getTypingMessage', (data) => {
            setUserConversations(prevConversations => {
                let temp = [...prevConversations];
                let index = temp.findIndex(curr => curr.ConversationId === data.conversationId);
                if (index !== -1) {
                    temp[index].ReceiverTypingMessage = data.typingMessage;
                }
                return temp;
            });


            setMessagesData(prevMessagesData => {
                if (prevMessagesData.ReceiverId === data.receiverId) {
                    return {
                        ...prevMessagesData,
                        TypingMessage: data.typingMessage
                    };
                } else {
                    return {
                        ...prevMessagesData,
                        TypingMessage: ""
                    };
                }
            });
        });


        socket.on('getDelteConversation', (data) => {
            let allConversations = userConversation;
            let index = allConversations.findIndex(curr => curr.conversationId === messagesData.conversationId);
            allConversations.splice(index, 1);
            setUserConversations(allConversations)
            setMessagesData({
                ReceiverId: "",
                ReceiverName: "",
                ReceiverImage: "",
                ReceiverEmail: "",
                messages: [],
                conversationId: ""
            })
            setConversationOpen(false)
            filter();
        })

    }, [socket, userConversation])



    //******************************************************************************************************************************  */

    const scrollToBottom = () => {
        const container = document.querySelector('.message-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    useEffect(() => {
        scrollToBottom();
    }, [messagesData])



    const fetchMessages = async (ConversationId, Name, Img, Id, Email, ReceiverTypingMessage) => {
        scrollToBottom();
        setMessageToBeSend('')
        socket.emit("updateCurrentlyTypingMessage", {
            typingMessage: "",
            conversationId: messagesData.conversationId,
            receiverId: messagesData.ReceiverId,
            senderId: userData.userId
        })
        const response = await fetch(`${GetMessageRoute}/${ConversationId}`)
        const resData = await response.json();
        setMessagesData({
            ReceiverId: Id,
            ReceiverName: Name,
            ReciverImage: Img,
            messages: resData.Data,
            conversationId: ConversationId,
            ReceiverEmail: Email,
            TypingMessage: ReceiverTypingMessage
        });
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
        socket.emit("updateCurrentlyTypingMessage", {
            typingMessage: "",
            conversationId: messagesData.conversationId,
            receiverId: messagesData.ReceiverId,
            senderId: userData.userId
        })

        if (messagesData.conversationId === 'new') {
            var NewConversationId = await CreateConversation();
        }


        if (messageToBeSend.trim().length > 0) {

            let now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            let month = now.getMonth() + 1;
            let year = now.getFullYear();
            let date = now.getDate();
            if (minutes < 10) {
                minutes = '0' + minutes
            }
            let time = `${hours}:${minutes}`
            let Fulldate = `${date}/${month}/${year}`


            const response = await fetch(`${SendMessageRoute}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    conversationId: NewConversationId ? NewConversationId : messagesData.conversationId,
                    senderId: userData.userId,
                    message: messageToBeSend,
                    time: time,
                    date: Fulldate
                })
            })

            const resData = await response.json();
            socket.emit('sendMessage', {
                senderId: userData.userId,
                receiverId: messagesData.ReceiverId,
                message: messageToBeSend,
                conversationId: NewConversationId ? NewConversationId : messagesData.conversationId,
                time,
                date: Fulldate,
                _id: resData._id
            })


            setMessageToBeSend('');

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


        }
    }

    const deleteMessage = async () => {
        const response = await fetch(DeleteMessageRoute, {
            method: "DELETE",
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({
                messageId: messageDetails.messageId
            })
        })

        if (response.ok) {

            const data = await response.json();
            socket.emit('getMessagesAfterDelete', { senderId: userData.userId, receiverId: messagesData.ReceiverId, conversationId: messagesData.conversationId })

            setShowDoubleClickPopUp(false);
        }
    }

    const delteConversation = async () => {
        setShowMoreOptions(false)
        const res = await fetch(DeleteChatRoute, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "conversationId": messagesData.conversationId
            })
        })
        if (res.ok) {
            socket.emit('deleteConversation', { senderId: userData.userId, receiverId: messagesData.ReceiverId })
        }
    }

    const clearChat = async () => {
        setShowMoreOptions(false)
        const res = await fetch(ClearChatRoute, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "conversationId": messagesData.conversationId,
                "senderId": userData.userId,
                "receiverId": messagesData.ReceiverId
            })
        })
        if (res.ok) {
            socket.emit('clearChat', { senderId: userData.userId, receiverId: messagesData.ReceiverId, conversationId: messagesData.conversationId })
        }
    }


    return (
        <>

            <div className='w-screen flex' style={{
                color: userData.theme === 'dark' && "white"
            }}>
                <div className={`w-[25%] h-screen ${userData.theme === "dark" ? "bg-[#282C35]" : "bg-secondary"}  conversation-section relative`}>
                    <div className='flex justify-center items-center my-5 h-[15vh] profile-section'>
                        <img src={userData.image} alt="" className='rounded-full profileImage border-primary border-2' />
                        <div className='ml-3'>
                            <h3 className='text-xl font-semibold accountName'>{userData.fullName}</h3>

                            <div className='text-lg text-gray-500 flex gap-1 items-center cursor-pointer'
                                onClick={() => setShowSettings(true)}
                            >
                                <p>
                                    Settings
                                </p>
                                <IoMdSettings className='' />
                            </div>
                        </div>

                        {/* SHow Setting POP UP ------------------------------------------------------------------------------------------- */}
                        <div className={`absolute top-[-100%] left-0 w-full py-5 px-3 shadow-lg transition ${userData.theme === "dark" ? "bg-[#282C35]" : "bg-white"}`} style={{
                            top: `${showSettings ? '0' : '-100%'}`,
                            transition: '.5s linear'
                        }}>
                            <figure className='w-full relative'>
                                <img src={userData.image} alt="" className='w-[150px] h-[150px] rounded-full mx-auto' />
                                <IoMdClose className='absolute top-0 right-5 cursor-pointer' onClick={() => setShowSettings(false)} />
                            </figure>
                            <div className='flex flex-col px-2 my-3'>
                                <h2 className='text-sm  border-b-2 py-1'>Name:- <span className='font-bold'> {userData.fullName} </span></h2>
                                <p className='text-sm  border-b-2 py-1'>Email:- <span className='font-bold'> {userData.email} </span></p>
                                <div className='flex gap-3 border-b-2 py-1 text-sm items-center'>
                                    <p>Theme:- </p>
                                    <select value={userData.theme} className='px-2 rounded-sm border border-slate-600 bg-transparent cursor-pointer ' onChange={async () => {
                                        await fetch(UpdateThemeRoute, {
                                            method: "PATCH",
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ _id: userData.userId })
                                        })
                                        setUserData({
                                            ...userData,
                                            theme: userData.theme === 'dark' ? 'light' : 'dark'
                                        })

                                    }}>
                                        <option className={`cursor-pointer ${userData.theme === "dark" ? "bg-[#282C35] text-white" : "bg-secondary"} p-0 m-0`} value="light">Light</option>
                                        <option className={`cursor-pointer ${userData.theme === "dark" ? "bg-[#282C35] text-white" : "bg-secondary"} p-0 m-0`} value="dark">Dark</option>
                                    </select>
                                </div>
                                <div className='flex gap-3 border-b-2 py-1 text-sm items-center'>
                                    <p>LiveMessage:- </p>
                                    <select value={userData.LiveMessage} className='px-2 rounded-sm border border-slate-600 bg-transparent cursor-pointer ' onChange={async () => {
                                        await fetch(LiveMessageRoute, {
                                            method: "PATCH",
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ _id: userData.userId })
                                        })
                                        setUserData({
                                            ...userData,
                                            LiveMessage: userData.LiveMessage === true ? false : true
                                        })
                                    }}>
                                        <option className={`cursor-pointer ${userData.theme === "dark" ? "bg-[#282C35] text-white" : "bg-secondary"} p-0 m-0`} value={true} >On</option>
                                        <option className={`cursor-pointer ${userData.theme === "dark" ? "bg-[#282C35] text-white" : "bg-secondary"} p-0 m-0`} value={false}>Off</option>
                                    </select>
                                </div>
                                <p className="text-red-400 hover:text-red-500 hover:font-semibold text-sm border-b-2 py-1 flex items-center gap-2 cursor-pointer"
                                    onClick={
                                        () => {
                                            let confirmation = confirm("Are you sure to logout?");
                                            if (confirmation) {

                                                socket.emit('removeUser', userData.userId)
                                                localStorage.removeItem('token')
                                                setIsLoggedIn(false)
                                                navigate('users/sign_in')
                                            }
                                        }
                                    }
                                >Logout <MdOutlineLogout /> </p>
                                <p className="text-red-400 hover:text-red-500 hover:font-semibold text-sm border-b-2 py-1 flex items-center gap-2 cursor-pointer"
                                    onClick={
                                        async () => {
                                            let confirmation = confirm("Are you sure to Delete Account");
                                            if (confirmation) {
                                                const res = await fetch(DeleteAccoutRoute, {
                                                    method: "DELETE",
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({ _id: userData.userId })
                                                })
                                                if (res.ok) {
                                                    socket.emit('removeUser', userData.userId)
                                                    localStorage.removeItem('token')
                                                    setIsLoggedIn(false)
                                                    navigate('users/sign_in')
                                                }
                                            }
                                        }
                                    }
                                >Delete Account </p>
                            </div>
                        </div>
                        {/* SHow Setting POP UP ------------------------------------------------------------------------------------------- */}
                    </div>
                    <hr />
                    <div className='pt-5 shadow-inner'>
                        <div className='text-primary text-xl ml-6'>Messages</div>
                        <div className='overflow-y-scroll h-[67vh] px-6 mt-3 no-scrollbar vh60'>
                            {
                                userConversation.length > 0 ?
                                    userConversation.map(({ fullName, image, ConversationId, userId, status = 'online', email, latestMessage, time, ReceiverTypingMessage }, index) => {
                                        return <>
                                            <div className={`px-3 flex items-center py-2  border-b border-bottom-gray-680 border-[5x] cursor-pointer ${userId === messagesData.ReceiverId ? "bg-[#cdecfba8]" : ""} hover:bg-[#cdecfba8]`} key={index} onClick={() => {
                                                fetchMessages(ConversationId, fullName, image, userId, email, ReceiverTypingMessage)
                                                setConversationOpen(true)

                                            }
                                            }
                                            >
                                                <div className='w-[70px] flex justify-center items-center'>
                                                    <img src={image} alt="" className='conversationImage rounded-full  border-primary border-2' />
                                                </div>
                                                <div className='ml-3 w-[100%]'>
                                                    <h3 className='text-lg font-semibold w-[100%] break-words conversationName flex justify-between items-center'>
                                                        <span>{fullName}</span>
                                                        <span className={`h-3 w-3 rounded-full ${onlineUsers.find(curr => curr.userId === userId) ? "bg-green-600" : "bg-red-600"}`}></span>
                                                    </h3>


                                                    {
                                                        latestMessage &&
                                                        <p className='text-[12px] font-light w-[100%] break-words conversationEmail flex justify-between items-center'>
                                                            <span>{(latestMessage.length < 20) ? latestMessage : `${latestMessage.substring(0, 20)}...`} </span>
                                                            <span>{time}</span>
                                                        </p>
                                                    }



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

                <div className={`w-[50%] h-screen  ${userData.theme === "dark" ? "bg-[#343A46]" : "bg-white"} flex flex-col items-center chat-section relative ${conversationOpen && 'openConversation'}`}>
                    {

                        messagesData.ReceiverName ?
                            <>
                                <div className={`w-[80%] px-8  h-[60px] mt-6 rounded-full flex justify-start items-center gap-3 p-9 mb-3 ${userData.theme === "dark" ? "bg-[#282C35]" : "bg-secondary"} `}>
                                    <IoMdArrowBack className='text-xl cursor-pointer arrow' onClick={() => {
                                        setConversationOpen(false)
                                        socket.emit("updateCurrentlyTypingMessage", {
                                            typingMessage: "",
                                            conversationId: messagesData.conversationId,
                                            receiverId: messagesData.ReceiverId,
                                            senderId: userData.userId
                                        })
                                    }} />
                                    <figure className='w-[80px]'>
                                        <img src={messagesData.ReciverImage} alt="" className='conversationImage rounded-full  border-primary border-2 cursor-pointer' onClick={() => {
                                            setPopUp(true)
                                        }} />
                                    </figure>
                                    <div className='flex justify-between items-center w-[100%]'>
                                        <div>

                                            <h3 className='text-sm font-bold'>{messagesData.ReceiverName}</h3>
                                            <p className='text-[12px] font-light'>
                                                {
                                                    onlineUsers.find(curr => curr.userId === messagesData.ReceiverId) ? "Online" : "Offline"
                                                }
                                            </p>
                                        </div>
                                        <div className={`cursor-pointer ${showMoreOptions && "bg-white"} rounded-full relative ${userData.theme === "dark" ? "!bg-[#282C35] !text-white" : "bg-secondary"}`}
                                            onClick={() => showMoreOptions ? setShowMoreOptions(false) : setShowMoreOptions(true)}
                                        >
                                            <BsThreeDotsVertical className='m-2' />
                                            {
                                                showMoreOptions &&
                                                <div className={`flex absolute top-[52px] right-[-40px]  text-sm  flex-col z-50 text-center ${userData.theme === "dark" ? "!bg-[#282C35] !text-white" : "bg-secondary"}`}>
                                                    <p className={`border-b-2 border-black-400 pb-1 cursor-pointer ${userData.theme === 'dark' ? "hover:bg-[#343A46]" : "hover:bg-[#e8ebf7]"} p-3`} onClick={() => clearChat()}>
                                                        Clear Chat
                                                    </p>
                                                    <p className={`border-b-2 border-black-400 pb-1 cursor-pointer w-full ${userData.theme === 'dark' ? "hover:bg-[#343A46]" : "hover:bg-[#e8ebf7]"} p-3 `} onClick={() => delteConversation()}>
                                                        Delete Conversation
                                                    </p>
                                                </div>
                                            }
                                        </div>
                                    </div>

                                </div>
                                <div className=' h-[75vh] vh70 w-full overflow-y-scroll style-scrollbar  message-container' onClick={() => setShowMoreOptions(false)}>
                                    {
                                        messagesData.messages.length > 0 ? (

                                            <div className='px-8 py-10 flex flex-col gap-5'>

                                                {
                                                    messagesData.messages.map(({ senderId, message, time, date, _id }, index) => (
                                                        <>
                                                            {
                                                                (index === 0) ? (

                                                                    <div className={`px-2 py-1 border rounded-lg text-sm mx-auto text-black  message bg-secondary ${userData.theme === "dark" ? "!bg-[#282C35] !text-white border-none" : "bg-secondary"} `}
                                                                        style={{ wordWrap: 'break-word' }}
                                                                    >
                                                                        {date}
                                                                    </div>
                                                                ) : (

                                                                    (date !== messagesData.messages[index - 1].date) && <div key={index} className={`no-select px-2 py-1 border rounded-lg text-sm mx-auto text-black  message ${userData.theme === "dark" ? "!bg-[#282C35] !text-white !border-none" : "bg-secondary"} `}
                                                                        style={{ wordWrap: 'break-word' }}
                                                                    >
                                                                        {date}
                                                                    </div>

                                                                )
                                                            }

                                                            {

                                                                <div className={`p-3 py-1 pr-11 message max-w-[52%] text-sm  cursor-pointer   ${senderId == userData.userId ? " bg-primary rounded-b-lg rounded-tl-lg  ml-auto text-white" : `bg-secondary rounded-b-lg rounded-tr-lg  mr-auto ${userData.theme === "dark" ? "!bg-[#282C35] !text-white" : "bg-secondary"}`}`}
                                                                    style={{ wordWrap: 'break-word' }}
                                                                    onDoubleClick={(e) => {
                                                                        setMessageDetails({
                                                                            senderId: userData.userId,
                                                                            receiverId: messagesData.ReceiverId,
                                                                            message: message,
                                                                            messageId: _id,
                                                                            showDelete: senderId == userData.userId ? true : false
                                                                        })
                                                                        setShowDoubleClickPopUp(true)
                                                                    }}
                                                                >
                                                                    {message}
                                                                    <span className={`message-time ${senderId == userData.userId && 'text-white'}`}>{time}</span>
                                                                </div>

                                                            }



                                                        </>
                                                    )
                                                    )
                                                }
                                                {
                                                    (messagesData.TypingMessage.length > 0 && messagesData.TypingMessage !== "") &&
                                                    <div className={`flex items-center p-3 py-1 pr-11 message max-w-[52%] text-sm  cursor-pointerbg-secondary rounded-b-lg rounded-tr-lg  mr-auto ${userData.theme === "dark" ? "!bg-[#282C35] !text-white" : "bg-secondary"}`}>
                                                        {userData.LiveMessage && messagesData.TypingMessage}
                                                        <div className='flex my-1 items-center'>
                                                            <span className="dot dot-1 h-[5px] w-[5px] rounded-full m-[2px] bg-white"></span>
                                                            <span className="dot dot-2 h-[5px] w-[5px] rounded-full m-[2px] bg-white"></span>
                                                            <span className="dot dot-3 h-[5px] w-[5px] rounded-full m-[2px] bg-white"></span>
                                                        </div>
                                                    </div >
                                                }

                                                {
                                                    showDoubleClickPopUp &&
                                                    <div className={`absolute h-[100%] w-[100%] bg-[#00000022] top-0 left-0`}>
                                                        <div className={`absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  text-black shadow-md px-9 py-7 rounded-lg flex flex-col gap-4 ${userData.theme === "dark" ? "bg-[#282C35]" : "bg-white"} `}>
                                                            <div className='text-center relative w-full'>
                                                                <p className={`w-full ${userData.theme === "dark" && "text-white"} `}>{messageDetails.message}</p>
                                                                <div className={`absolute top-[-15px] right-[-15px] text-black hover:bg-[#0000003e] hover:text-white rounded-full text-xl p-1 cursor-pointer ${userData.theme === "dark" && "text-white"}`} onClick={() => setShowDoubleClickPopUp(false)}>
                                                                    <IoMdClose />
                                                                </div>
                                                            </div>
                                                            <div className='flex gap-4'>
                                                                {messageDetails.showDelete &&
                                                                    <button className='bg-red-500 text-white text-sm px-2 w-32 py-1 cursor-pointer hover:bg-red-400'
                                                                        onClick={() => deleteMessage()}
                                                                    >Delete Message</button>
                                                                }
                                                                <button className='bg-blue-500 text-white text-sm px-2 w-32 py-1 cursor-pointer hover:bg-blue-400'
                                                                    onClick={async (e) => {
                                                                        setShowDoubleClickPopUp(false)
                                                                        await navigator.clipboard.writeText(messageDetails.message);
                                                                        e.target.innerText = 'Copied!';
                                                                        toast.success("Message Copied!", {
                                                                            style: {
                                                                                backgroundColor: userData.theme === 'dark' && '#282C35', // Custom background color
                                                                                color: userData.theme === 'dark' && '#fff' // Custom text color
                                                                            }
                                                                        })
                                                                    }}
                                                                >Copy Message</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }

                                            </div>
                                        ) : (

                                            <div>
                                                <h3 className='text-center my-[20vh]'>No Messages</h3>
                                            </div>
                                        )
                                    }
                                </div>
                                <div className="w-full px-4 flex  gap-1" onClick={() => setShowMoreOptions(false)}>
                                    <Input
                                        placeholder='Type Your Message...'
                                        name='text'
                                        type='text'
                                        className={`cursor-text shadow-xl my-3 focus:outline-none focus:border-[secondary] width-[90%] sendMessage ${userData.theme === "dark" ? "!bg-[#282C35] !text-white" : "bg-secondary"}`}
                                        value={messageToBeSend}
                                        onChange={(e) => {
                                            setMessageToBeSend(e.target.value)
                                            console.log("Called");
                                            socket.emit("updateCurrentlyTypingMessage", {
                                                typingMessage: !userData.LiveMessage ? e.target.value === "" ? "" : " " : e.target.value,
                                                conversationId: messagesData.conversationId,
                                                receiverId: messagesData.ReceiverId,
                                                senderId: userData.userId
                                            })
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
                </div >

                <div className={`w-[25%] h-screen ${userData.theme === "dark" ? "!bg-[#282C35]" : "bg-secondary"} addNewUserSection ${addNewFriends && "openNewFriends"}`}>
                    <div>
                        <div className='flex'>
                            <p className='text-primary px-6 pt-8 pb-4 text-xl'>Other Users</p>
                            <div className="close-newUsers ml-auto  text-white" onClick={() => { setAddNewFriends(false) }}>
                                <IoMdClose className='bg-red-600 text-xl rounded-full cursor-pointer' />
                            </div>
                        </div>
                    </div>
                    <div className='overflow-y-scroll h-[67vh] px-6  no-scrollbar '>
                        <Input placeholder='Search User' value={searchUser} className={`${userData.theme === "dark" ? "!bg-[#282C35] text-white" : "bg-secondary"} outline-none`} onChange={(e) => {
                            setSearchUser(e.target.value)
                            let temp = filterUsers.filter(curr => (curr.fullName.includes(e.target.value) || curr.email.includes(e.target.value)));
                            setFinalFilteredUser([...temp]);
                        }} />
                        {
                            (FinalFilteredUser && FinalFilteredUser.length > 0) && FinalFilteredUser.map(({ fullName, image, _id, email }, index) => {
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
                                            <div className='w-[80px]'>
                                                <img src={image} alt="" className='rounded-full conversationImage  border-primary border-2' />
                                            </div>
                                            <div className='ml-3 w-[100%]'>
                                                <h3 className='text-lg font-semibold flex justify-between items-center w-[100%]'>

                                                    <span>{fullName}</span>
                                                    <span className={`h-3 w-3 rounded-full ${onlineUsers.find(curr => curr.userId === _id) ? "bg-green-600" : "bg-red-600"}`}></span>
                                                </h3>
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
                    popUp && <div className={` h-[100vh] w-[100vw] bg-[#00000074] absolute top-0 left-0 popupDetails`}>

                        <div className={`center h-[320px] w-[300px]  flex-col gap-2 bg-white rounded-lg flex justify-center items-center shadow-lg shadow-white relative ${userData.theme === "dark" ? "!bg-[#282C35]  !shadow-black" : "!bg-white"}`}>
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
            <ToastContainer
                position="top-right"
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


export default Dashboard   