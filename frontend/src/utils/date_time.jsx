import { format } from 'date-fns';

const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMMM dd, yyyy');
};

export { formatDate };
