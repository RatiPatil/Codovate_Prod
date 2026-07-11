import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const showAlert = (msg, type = 'info') => {
    if (type === 'error' || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('error')) {
        toast.error(msg);
    } else {
        toast.success(msg);
    }
};

export const showConfirm = async (msg) => {
    const result = await Swal.fire({
        title: 'Confirm',
        text: msg,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes',
        background: '#1a1a1a',
        color: '#fff'
    });
    return result.isConfirmed;
};
