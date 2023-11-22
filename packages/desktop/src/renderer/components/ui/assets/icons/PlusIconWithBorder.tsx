import React from 'react'

interface PlusIconProps {
    color: string
}

export const PlusIcon: React.FC<PlusIconProps> = ({ color }) => {
    return (
        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
                d='M22.0499 12C22.0499 17.5505 17.5504 22.05 12 22.05C6.44949 22.05 1.94995 17.5505 1.94995 12C1.94995 6.44955 6.44949 1.95001 12 1.95001C17.5504 1.95001 22.0499 6.44955 22.0499 12Z'
                stroke={color}
                strokeWidth='1.5'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M17.3415 12.5982H12.5983V17.3415H11.4018V12.5982H6.65857V11.4018H11.4018V6.65851H12.5983V11.4018H17.3415V12.5982Z'
                fill={color}
            />
        </svg>
    )
}
export default PlusIcon
