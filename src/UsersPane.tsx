import { useState } from 'react';

interface UserPaneProps {
    users: { name: string, id: string }[];
}

const UsersPane = ({ users }: UserPaneProps) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="fixed top-0 right-0 bg-gray-700 text-white w-20 md:w-24 shadow-lg z-50">
            <button
                className="text-xs font-bold w-full text-left flex justify-between items-center"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                Users
                <span className="ml-1">
                    {isCollapsed ? '▼' : '▲'}
                </span>
            </button>
            {!isCollapsed && (
                <ul className="text-xs space-y-1">
                    {users.map((user) => (
                        <li key={user.id}>{user.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UsersPane;
