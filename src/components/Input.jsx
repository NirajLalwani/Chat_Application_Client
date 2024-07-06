import React from 'react'

const Input = ({
    label = "",
    name = "",
    type = "",
    className = "",
    isRequired = false,
    placeholder = '',
    value = "",
    onChange = "",
    onKeyDown,
    accept = ""

}) => {
    return (
        <div className='my-3 w-full'>
            <label htmlFor={name} className=' my-1 outeblock text-sm font-medium text-gray-800'>{label}</label>
            <input type={type}
                id={name}
                className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500  focus:border-blue-500 focus:rounded-lg block w-full p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-500 ${className}`}
                placeholder={placeholder}
                required={isRequired}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                accept='image/*'
            />
        </div>
    )
}

export default Input
