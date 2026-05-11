import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

const ConfirmNavigation = () => {
    const saveStatus = useAppSelector((state) => state.ui.saveStatus);

    const blocker = useBlocker(() => {
        if (saveStatus === 'saving') {
            return true;
        }
        return false;
    });

    useEffect(() => {
        if (blocker.state === 'blocked') {
            const ok = window.confirm(
                'Есть несохранённые изменения, точно выйти?'
            );
            if (ok) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    return null;
};

export default ConfirmNavigation;