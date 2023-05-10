type Props = {
    count: number;
    text: string;
}

const SectionDivider: React.FC<React.PropsWithChildren<Props>> = ({ text, count, children }) => {
    return (
        <div className="flex w-full items-center p-2">
            <div className="flex gap-2 flex-nowrap w-min whitespace-nowrap mr-1">
                <div>{text}</div>
                <span className="text-neutral-500">({count})</span>
            </div>
            <hr className="flex-grow" />
            <div className="w-min whitespace-nowrap ml-1">
                {children}
            </div>
        </div>
    );
}

export default SectionDivider;